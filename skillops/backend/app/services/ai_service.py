"""AI Service — Groq/OpenAI-compatible API integration with mock fallback.

Set GROQ_API_KEY in .env to enable real AI responses.
Free Groq API: https://console.groq.com  (llama-3.1-8b-instant)
"""
import os
import json
import logging
import httpx
from typing import List, Optional

logger = logging.getLogger(__name__)

AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1")
AI_MODEL    = os.getenv("AI_MODEL", "llama-3.1-8b-instant")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


async def _call_ai(messages: List[dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
    """Call OpenAI-compatible API. Returns text response or raises."""
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        raise ValueError("AI_API_KEY not configured")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{AI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": AI_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


# ── Summarize Study Material ──────────────────────────────────────────────────

async def summarize_material(title: str, content: str) -> dict:
    """Generate summary, key points, and flashcards from study material."""
    SYSTEM = (
        "You are an expert study assistant. Given study material, produce a structured JSON response with:\n"
        '{"summary": "concise 2-3 sentence summary",\n'
        ' "key_points": ["point 1", "point 2", ...],\n'
        ' "flashcards": [{"q": "question", "a": "answer"}, ...]}\n'
        "Return ONLY valid JSON. key_points: 5-7 items. flashcards: 3-5 cards."
    )
    prompt = f"Title: {title}\n\nContent:\n{content[:3000]}"

    try:
        raw = await _call_ai([
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt}
        ], temperature=0.4, max_tokens=800)
        # Extract JSON from response
        start = raw.find("{")
        end   = raw.rfind("}") + 1
        return json.loads(raw[start:end])
    except ValueError:
        return _mock_summary(title, content)
    except Exception as e:
        logger.warning(f"AI summarize failed: {e}")
        return _mock_summary(title, content)


def _mock_summary(title: str, content: str) -> dict:
    words = content.split()[:20]
    return {
        "summary": f"This material covers '{title}'. Configure GROQ_API_KEY in .env for AI-generated summaries. Key topics include: {' '.join(words[:10])}...",
        "key_points": [
            f"Topic: {title}",
            "Review the source material carefully",
            "Take notes while reading",
            "Practice with exercises after studying",
            "Configure AI for automatic smart summaries",
        ],
        "flashcards": [
            {"q": f"What is the main topic of '{title}'?", "a": "See the full material for details."},
            {"q": "How do you enable AI summarization?", "a": "Set GROQ_API_KEY in the .env file."},
        ]
    }


# ── Generate Quiz Questions ───────────────────────────────────────────────────

async def generate_quiz(topics: List[str], num_questions: int = 5, difficulty: str = "medium") -> List[dict]:
    """Generate quiz questions for given topics."""
    SYSTEM = (
        "You are a quiz generator for tech learners. Generate multiple-choice questions in JSON.\n"
        'Return ONLY a JSON array: [{"question": "...", "options": ["A", "B", "C", "D"], "answer": "A", "explanation": "...", "type": "multiple_choice"}, ...]\n'
        "Make questions practical and relevant to the topics."
    )
    prompt = f"Topics: {', '.join(topics)}\nDifficulty: {difficulty}\nNumber of questions: {num_questions}"

    try:
        raw = await _call_ai([
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt}
        ], temperature=0.6, max_tokens=1200)
        start = raw.find("[")
        end   = raw.rfind("]") + 1
        return json.loads(raw[start:end])
    except ValueError:
        return _mock_quiz(topics, num_questions)
    except Exception as e:
        logger.warning(f"AI quiz failed: {e}")
        return _mock_quiz(topics, num_questions)


def _mock_quiz(topics: List[str], n: int) -> List[dict]:
    topic = topics[0] if topics else "Programming"
    base = [
        {
            "question": f"Which of the following best describes {topic}?",
            "options": [
                f"A core concept in {topic} development",
                "A type of database management system",
                "A version control protocol",
                "A network security standard"
            ],
            "answer": f"A core concept in {topic} development",
            "explanation": f"Enable GROQ_API_KEY for real AI-generated questions about {topic}.",
            "type": "multiple_choice"
        },
        {
            "question": "What does DRY stand for in software development?",
            "options": ["Don't Repeat Yourself", "Do Run Yearly", "Data Redundancy Yield", "Dynamic Runtime YAML"],
            "answer": "Don't Repeat Yourself",
            "explanation": "DRY is a principle of software development aimed at reducing repetition.",
            "type": "multiple_choice"
        },
        {
            "question": "Which HTTP status code indicates a successful response?",
            "options": ["200", "404", "500", "301"],
            "answer": "200",
            "explanation": "HTTP 200 OK means the request was successful.",
            "type": "multiple_choice"
        },
        {
            "question": "What does CI/CD stand for?",
            "options": ["Continuous Integration/Continuous Deployment", "Code Inspection/Code Delivery", "Central Interface/Central Design", "None of the above"],
            "answer": "Continuous Integration/Continuous Deployment",
            "explanation": "CI/CD automates the building, testing, and deployment of applications.",
            "type": "multiple_choice"
        },
        {
            "question": "Which data structure follows the LIFO principle?",
            "options": ["Stack", "Queue", "Array", "Linked List"],
            "answer": "Stack",
            "explanation": "A Stack follows Last In, First Out (LIFO) principle.",
            "type": "multiple_choice"
        },
    ]
    return base[:n]


# ── AI Chat ───────────────────────────────────────────────────────────────────

CHAT_SYSTEM = """You are SkillBot, an expert AI mentor for tech learners.
You specialize in: Python, FastAPI, JavaScript, React, Linux, Docker, Azure DevOps, Salesforce, SQL, Data Structures & Algorithms, and career guidance.
Be concise, practical, and encouraging. Use code examples when helpful.
Always provide actionable advice. If asked about concepts, explain clearly with examples."""


async def chat_response(history: List[dict], new_message: str) -> str:
    """Generate AI chat response."""
    messages = [{"role": "system", "content": CHAT_SYSTEM}]
    # Include last 10 messages for context
    messages.extend(history[-10:])
    messages.append({"role": "user", "content": new_message})

    try:
        return await _call_ai(messages, temperature=0.7, max_tokens=800)
    except ValueError:
        return _mock_chat_response(new_message)
    except Exception as e:
        logger.warning(f"AI chat failed: {e}")
        return _mock_chat_response(new_message)


def _mock_chat_response(message: str) -> str:
    msg = message.lower()
    if any(w in msg for w in ["python", "py"]):
        return "Great question about Python! 🐍 Python is a versatile language. **Tip:** Set your `GROQ_API_KEY` in the `.env` file to get real AI responses. In the meantime — are you asking about OOP, async, or a specific library?"
    if any(w in msg for w in ["docker", "container"]):
        return "Docker containers are isolated environments that package your app with its dependencies. 🐳 **Key commands:** `docker build`, `docker run`, `docker ps`, `docker-compose up`. Set your AI API key for detailed explanations!"
    if any(w in msg for w in ["job", "interview", "career"]):
        return "For tech jobs, focus on: **1)** Strong portfolio on GitHub **2)** LeetCode practice (Easy→Medium) **3)** System design basics **4)** Behavioral questions (STAR method). Use the Interview Simulator tab for practice! 🎯"
    return "I'm SkillBot, your AI learning mentor! 🤖 To enable full AI capabilities, add your **GROQ_API_KEY** to the `.env` file (free at console.groq.com). I can help with Python, DevOps, career advice, code review, and more!"


# ── Interview Simulation ──────────────────────────────────────────────────────

INTERVIEW_SYSTEM = """You are an expert technical interviewer at a top tech company.
Conduct realistic technical and behavioral interviews. Ask one question at a time.
When given an answer, evaluate it thoroughly and provide detailed feedback.
Return structured JSON responses as instructed."""


async def generate_interview_questions(interview_type: str, topics: List[str]) -> List[str]:
    """Generate 5 interview questions."""
    SYSTEM = (
        "You are a senior interviewer. Generate 5 interview questions as a JSON array of strings.\n"
        "Mix technical and practical questions. Return ONLY: [\"question1\", \"question2\", ...]"
    )
    prompt = f"Interview type: {interview_type}\nTopics/Skills: {', '.join(topics)}\nGenerate 5 questions."

    try:
        raw = await _call_ai([
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt}
        ], temperature=0.5, max_tokens=600)
        start, end = raw.find("["), raw.rfind("]") + 1
        return json.loads(raw[start:end])
    except Exception:
        return _mock_interview_questions(interview_type, topics)


def _mock_interview_questions(interview_type: str, topics: List[str]) -> List[str]:
    technical_q = [
        f"Explain the difference between a list and a tuple in Python, and when would you use each?",
        f"How does REST API differ from GraphQL? When would you choose one over the other?",
        f"Describe the Git workflow you'd use in a team project with multiple developers.",
        f"What is Docker and how does containerization benefit a DevOps workflow?",
        f"Walk me through your approach to debugging a production issue in a web application.",
    ]
    behavioral_q = [
        "Tell me about a challenging project you worked on and how you overcame obstacles.",
        "Describe a situation where you had to learn a new technology quickly. How did you approach it?",
        "How do you prioritize tasks when you have multiple deadlines?",
        "Tell me about a time you made a mistake and how you handled it.",
        "Where do you see yourself in 2 years as a developer?",
    ]
    return technical_q if interview_type == "technical" else behavioral_q


async def evaluate_interview_answer(question: str, answer: str, interview_type: str) -> dict:
    """Evaluate a single interview answer."""
    SYSTEM = (
        "You are a senior interviewer evaluating a candidate's answer. Return JSON:\n"
        '{"score": 0-10, "feedback": "detailed feedback", "strengths": ["..."], "improvements": ["..."], "sample_answer": "brief ideal answer"}'
    )
    prompt = f"Question: {question}\n\nCandidate's Answer: {answer}\nInterview type: {interview_type}"

    try:
        raw = await _call_ai([
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt}
        ], temperature=0.4, max_tokens=600)
        start, end = raw.find("{"), raw.rfind("}") + 1
        return json.loads(raw[start:end])
    except Exception:
        return {
            "score": 7,
            "feedback": "Good attempt! Configure GROQ_API_KEY for detailed AI feedback on your answers.",
            "strengths": ["Showed understanding of the topic", "Clear communication"],
            "improvements": ["Add more specific examples", "Mention edge cases"],
            "sample_answer": "Enable AI for a sample ideal answer."
        }


async def generate_overall_feedback(questions: List[str], answers: List[str], scores: List[int]) -> dict:
    """Generate overall interview feedback."""
    avg = sum(scores) / len(scores) if scores else 0
    try:
        qa_text = "\n".join([f"Q{i+1}: {q}\nA{i+1}: {a}" for i, (q, a) in enumerate(zip(questions, answers))])
        SYSTEM = (
            "You are a senior hiring manager. Given a mock interview, return JSON:\n"
            '{"overall_feedback": "paragraph", "strengths": ["..."], "weaknesses": ["..."], "action_items": ["..."]}'
        )
        raw = await _call_ai([
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": f"Interview Q&A:\n{qa_text}\nAverage score: {avg:.1f}/10"}
        ], temperature=0.4, max_tokens=600)
        start, end = raw.find("{"), raw.rfind("}") + 1
        return json.loads(raw[start:end])
    except Exception:
        rating = "strong" if avg >= 7 else "developing" if avg >= 5 else "needs work"
        return {
            "overall_feedback": f"Your performance shows {rating} skills. Average score: {avg:.1f}/10. Add GROQ_API_KEY for detailed feedback.",
            "strengths": ["Communication", "Technical knowledge"],
            "weaknesses": ["Need more specific examples", "Practice deeper explanations"],
            "action_items": ["Practice daily LeetCode", "Review system design", "Prepare STAR stories"],
        }


# ── Job Matching ──────────────────────────────────────────────────────────────

async def match_jobs_to_skills(jobs: List[dict], skills: List[str], experience: str) -> List[dict]:
    """Score and rank jobs by skill match."""
    try:
        SYSTEM = (
            "You are a career advisor. Given jobs and user skills, score each job 0-100 for match quality.\n"
            "Return JSON array: [{\"id\": job_id, \"match_score\": 0-100, \"match_reason\": \"brief reason\", \"missing_skills\": [\"skill\"]}, ...]"
        )
        jobs_summary = [{"id": j["id"], "title": j["title"], "required_skills": j["skills"]} for j in jobs[:10]]
        prompt = f"User skills: {', '.join(skills)}\nExperience: {experience}\nJobs: {json.dumps(jobs_summary)}"
        raw = await _call_ai([
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt}
        ], temperature=0.3, max_tokens=800)
        start, end = raw.find("["), raw.rfind("]") + 1
        matches = json.loads(raw[start:end])
        # Merge match data into jobs
        match_map = {m["id"]: m for m in matches}
        for job in jobs:
            m = match_map.get(job["id"], {})
            job["match_score"] = m.get("match_score", 50)
            job["match_reason"] = m.get("match_reason", "Add AI key for detailed matching")
            job["missing_skills"] = m.get("missing_skills", [])
        return sorted(jobs, key=lambda x: x.get("match_score", 0), reverse=True)
    except Exception:
        # Simple local scoring fallback
        for job in jobs:
            user_skills_lower = [s.lower() for s in skills]
            required = [r.lower() for r in job.get("skills", [])]
            matched = sum(1 for r in required if any(r in us or us in r for us in user_skills_lower))
            job["match_score"] = int((matched / max(len(required), 1)) * 100)
            job["match_reason"] = f"Matched {matched}/{len(required)} required skills"
            job["missing_skills"] = [r for r in required if not any(r in us or us in r for us in user_skills_lower)]
        return sorted(jobs, key=lambda x: x.get("match_score", 0), reverse=True)
