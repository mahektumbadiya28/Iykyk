"""
SkillOps - AI Service using Groq API
Handles: Chat, Summarization, Quiz Generation, Interview Simulation
"""
import os
import json
import re
from typing import List, Dict, Any, Optional
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

is_valid_key = bool(GROQ_API_KEY and GROQ_API_KEY.strip() and GROQ_API_KEY != "your_groq_api_key_here")
client = AsyncGroq(api_key=GROQ_API_KEY) if is_valid_key else None


SYSTEM_MENTOR = """You are SkillOps AI — an expert career mentor and technical educator specializing in:
- Python, FastAPI, Django, Flask
- Linux, Bash, Shell scripting  
- Azure Cloud, AWS basics, DevOps (Docker, Kubernetes, CI/CD, Terraform)
- Salesforce (Admin, Developer, LWC)
- Web Development (HTML, CSS, JavaScript, React)
- Data Structures & Algorithms
- Job interview preparation and career strategy

Your tone: Encouraging, precise, practical. Give code examples when helpful. 
Keep answers concise unless depth is explicitly requested."""


async def _chat_completion(messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1500) -> str:
    if not client:
        return "AI features require a valid Groq API key. Add your GROQ_API_KEY to the backend/.env file."
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"AI service error: {str(e)}"


# ─── CHAT ────────────────────────────────────────────────────────────────────

async def chat_with_mentor(
    user_message: str,
    conversation_history: List[Dict],
    context: str = "general"
) -> str:
    system = SYSTEM_MENTOR
    if context == "interview":
        system += "\nYou are currently conducting a mock technical interview. Be professional and evaluative."
    elif context == "quiz":
        system += "\nYou are reviewing quiz answers and providing educational feedback."

    messages = [{"role": "system", "content": system}]
    # Keep last 10 messages for context window
    messages.extend(conversation_history[-10:])
    messages.append({"role": "user", "content": user_message})
    return await _chat_completion(messages, temperature=0.7, max_tokens=1200)


# ─── SUMMARIZATION ───────────────────────────────────────────────────────────

async def summarize_material(title: str, content: str) -> Dict[str, Any]:
    prompt = f"""Analyze the following study material titled "{title}" and provide:

1. A concise 3-5 sentence SUMMARY
2. 5-7 KEY POINTS as bullet points
3. 5 FLASHCARD Q&A pairs for active recall

Material:
{content[:4000]}

Return a JSON object with this exact structure:
{{
  "summary": "...",
  "key_points": ["point1", "point2", ...],
  "flashcards": [
    {{"q": "question1", "a": "answer1"}},
    ...
  ]
}}

Return ONLY valid JSON, no extra text."""

    response = await _chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000
    )
    try:
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except:
        pass
    return {
        "summary": response[:500],
        "key_points": ["Review the material for key insights"],
        "flashcards": [{"q": "What is the main concept?", "a": "Review the material"}]
    }


# ─── QUIZ GENERATION ─────────────────────────────────────────────────────────

async def generate_daily_quiz(topics: List[str], materials_content: List[str]) -> List[Dict]:
    topics_str = ", ".join(topics) if topics else "general programming and career skills"
    context = "\n\n".join(materials_content[:3])[:3000] if materials_content else ""

    prompt = f"""Generate exactly 5 multiple-choice quiz questions for a learner who studied: {topics_str}
    
{f"Based on this content: {context}" if context else ""}

Return a JSON array with exactly 5 questions in this format:
[
  {{
    "question": "What is...?",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct": "A",
    "explanation": "Brief explanation of the correct answer"
  }}
]

Make questions practical, not trivial. Test real understanding. Return ONLY valid JSON."""

    response = await _chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=2000
    )
    try:
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except:
        pass
    return _fallback_quiz(topics_str)


def _fallback_quiz(topic: str) -> List[Dict]:
    return [
        {
            "question": f"Which of the following best describes a key concept in {topic}?",
            "options": ["A) Abstraction", "B) Redundancy", "C) Ambiguity", "D) None of the above"],
            "correct": "A",
            "explanation": "Abstraction is a fundamental concept in software engineering."
        }
    ] * 5


# ─── INTERVIEW SIMULATION ────────────────────────────────────────────────────

async def generate_interview_questions(job_role: str, domain: str) -> List[Dict]:
    prompt = f"""Generate 8 interview questions for a "{job_role}" position in the "{domain}" domain.
Mix: 4 technical, 2 behavioral, 2 situational questions.

Return JSON array:
[
  {{
    "type": "technical|behavioral|situational",
    "question": "Question text",
    "evaluation_criteria": ["criterion1", "criterion2"],
    "sample_answer": "Brief ideal answer outline"
  }}
]

Return ONLY valid JSON."""

    response = await _chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=2500
    )
    try:
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except:
        pass
    return []


async def evaluate_interview_answer(
    question: str,
    user_answer: str,
    evaluation_criteria: List[str],
    sample_answer: str
) -> Dict:
    criteria_str = "\n".join(f"- {c}" for c in evaluation_criteria)
    prompt = f"""Evaluate this interview answer:

QUESTION: {question}

EVALUATION CRITERIA:
{criteria_str}

IDEAL ANSWER OUTLINE: {sample_answer}

USER'S ANSWER: {user_answer}

Provide a JSON evaluation:
{{
  "score": <0-10>,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "feedback": "Detailed constructive feedback (2-3 sentences)",
  "improved_answer": "How they could improve this answer"
}}

Return ONLY valid JSON."""

    response = await _chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1000
    )
    try:
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except:
        pass
    return {"score": 5, "strengths": [], "weaknesses": [], "feedback": "Could not evaluate.", "improved_answer": ""}


async def generate_interview_report(
    questions_data: List[Dict],
    job_role: str,
    domain: str
) -> Dict:
    scores = [q.get("score", 5) for q in questions_data if "score" in q]
    avg_score = sum(scores) / len(scores) if scores else 0

    all_weaknesses = []
    all_strengths = []
    for q in questions_data:
        all_weaknesses.extend(q.get("weaknesses", []))
        all_strengths.extend(q.get("strengths", []))

    prompt = f"""Create a final interview report for a "{job_role}" / "{domain}" mock interview.
Average score: {avg_score:.1f}/10
Weaknesses identified: {', '.join(all_weaknesses[:5])}
Strengths identified: {', '.join(all_strengths[:5])}

Return JSON:
{{
  "overall_score": {avg_score:.1f},
  "grade": "A/B/C/D/F",
  "summary": "2-3 sentence overall assessment",
  "top_strengths": ["strength1", "strength2", "strength3"],
  "top_weaknesses": ["weakness1", "weakness2", "weakness3"],
  "improvement_plan": "Specific 5-step action plan to improve for the next interview"
}}

Return ONLY valid JSON."""

    response = await _chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1000
    )
    try:
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except:
        pass
    return {
        "overall_score": avg_score,
        "grade": "C",
        "summary": "Interview completed.",
        "top_strengths": all_strengths[:3],
        "top_weaknesses": all_weaknesses[:3],
        "improvement_plan": "Continue practicing with mock interviews."
    }


# ─── MISTAKE EXPLANATION ─────────────────────────────────────────────────────

async def explain_mistake(title: str, description: str) -> str:
    prompt = f"""A learner made this mistake:
Title: {title}
Description: {description}

Provide a clear, encouraging explanation covering:
1. Why this mistake commonly happens
2. The correct understanding/approach
3. A memorable tip to avoid it in the future
Keep it under 200 words."""

    return await _chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=400
    )


# ─── JOB OPPORTUNITY FINDER ──────────────────────────────────────────────────

async def find_job_opportunities(user_skills: List[str], experience_level: str = "entry") -> List[Dict]:
    skills_str = ", ".join(user_skills) if user_skills else "Python, Web Development"
    prompt = f"""Generate 8 realistic job opportunities for an {experience_level}-level developer with these skills: {skills_str}

Return a JSON array:
[
  {{
    "title": "Job Title",
    "company": "Company Name",
    "location": "City, Country / Remote",
    "type": "Internship|Full-time|Part-time|Contract",
    "domain": "DevOps|Salesforce|Web Dev|Python|Cloud",
    "match_score": <60-99>,
    "description": "2-sentence job description",
    "skills_required": ["skill1", "skill2", "skill3"],
    "apply_url": "https://linkedin.com/jobs/search?keywords=..."
  }}
]

Return ONLY valid JSON."""

    response = await _chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.6,
        max_tokens=2000
    )
    try:
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except:
        pass
    return []


async def match_resume_to_job(user_skills: List[str], job_title: str, job_description: str) -> Dict:
    prompt = f"""A candidate with skills [{', '.join(user_skills)}] is applying for: {job_title}

Job Description: {job_description}

Provide resume tailoring advice in JSON:
{{
  "match_percentage": <0-100>,
  "missing_skills": ["skill1", "skill2"],
  "highlight_skills": ["skill to emphasize"],
  "resume_tips": ["tip1", "tip2", "tip3"],
  "cover_letter_hook": "One strong opening sentence for cover letter"
}}

Return ONLY valid JSON."""

    response = await _chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=800
    )
    try:
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except:
        pass
    return {"match_percentage": 70, "missing_skills": [], "highlight_skills": [], "resume_tips": [], "cover_letter_hook": ""}
