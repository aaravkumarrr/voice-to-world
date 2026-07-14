from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from anthropic import Anthropic
import json
from scene_validator import validate_scene, format_violations_for_retry


# FASTAPI SETUP
app = FastAPI()
origins = [
    "http://localhost:3000",
    "http://192.168.0.150:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers=["*"]
)

# SceneRequest class creation for usage in generate_scene
class SceneRequest(BaseModel):
    sentence:str

__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))

with open(os.path.join(__location__,'system_prompt.txt')) as f:
    SYSTEM_PROMPT = f.read()

@app.get("/")
async def root():
    return {"Status": "Running"}

@app.post("/generate-scene")
async def generate_scene(request: SceneRequest):
    client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    def call_claude(extra_instructions=""):
        message = client.messages.create(
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": request.sentence + extra_instructions}],
            model="claude-sonnet-4-6"
        )
        text = message.content[0].text
        return json.loads(text)

    try:
        scene = call_claude()
    except json.JSONDecodeError as e:
        return {"error": str(e)}

    violations = validate_scene(scene)
    if violations:
        feedback = format_violations_for_retry(violations)
        try:
            scene = call_claude(extra_instructions=f"\n\n{feedback}\nPlease regenerate the full scene with these issues fixed.")
        except json.JSONDecodeError as e:
            return {"error": str(e), "original_violations": violations}

    return scene