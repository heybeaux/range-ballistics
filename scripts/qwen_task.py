"""Send one bounded coding task to the local Qwen 3.8 model and write the files it returns.

Usage: python3 scripts/qwen_task.py <prompt.md> <owned-path> [<owned-path> ...]

The model must answer with blocks of the form
    === FILE: relative/path ===
    ...content...
    === END FILE ===
Only paths named on the command line are written; anything else is refused.
The raw answer is saved beside the prompt as <prompt>.response.txt.
"""
import json
import os
import pathlib
import re
import subprocess
import sys

URL = "http://127.0.0.1:11435/v1/chat/completions"
MODEL = "mlx-community--Qwen3.8-27B-8bit"
FORMAT = (
    "\n\nANSWER FORMAT (strict): output every file in full, each as\n"
    "=== FILE: <path> ===\n<file content, no markdown fences>\n=== END FILE ===\n"
    "Output nothing else: no explanation before, between, or after the files."
)


def main() -> int:
    prompt_path = pathlib.Path(sys.argv[1])
    owned = set(sys.argv[2:])
    root = pathlib.Path(__file__).resolve().parent.parent
    body = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt_path.read_text() + FORMAT}],
        "max_tokens": 16000,
        "temperature": 0.2,
        "stream": True,
    }
    if os.environ.get("QWEN_THINK", "1") == "0":
        body["chat_template_kwargs"] = {"enable_thinking": False}
    # Streamed so a long answer is not lost to a client timeout; reasoning is kept apart from the answer.
    proc = subprocess.Popen(
        ["curl", "-sN", "-m", "1500", URL, "-H", "Content-Type: application/json", "--data-binary", json.dumps(body)],
        stdout=subprocess.PIPE,
    )
    text, reasoning, finish = "", "", None
    assert proc.stdout is not None
    for raw in proc.stdout:
        line = raw.decode(errors="replace").strip()
        if not line.startswith("data:") or line.endswith("[DONE]"):
            if line.startswith("{"):
                print("server said:", line[:600])
            continue
        try:
            choice = json.loads(line[5:])["choices"][0]
        except Exception:
            continue
        delta = choice.get("delta", {})
        text += delta.get("content") or ""
        reasoning += delta.get("reasoning_content") or ""
        finish = choice.get("finish_reason") or finish
    proc.wait()
    prompt_path.with_suffix(".reasoning.txt").write_text(reasoning)
    print("finish:", finish, "answer chars:", len(text), "reasoning chars:", len(reasoning))
    prompt_path.with_suffix(".response.txt").write_text(text)
    blocks = re.findall(r"=== FILE: (.+?) ===\n(.*?)\n=== END FILE ===", text, flags=re.S)
    if not blocks:
        print("no file blocks in answer")
        return 3
    written = []
    for rel, content in blocks:
        rel = rel.strip()
        if rel not in owned:
            print("REFUSED (not owned):", rel)
            continue
        content = re.sub(r"^```[a-z]*\n", "", content)
        content = re.sub(r"\n```\s*$", "", content)
        target = root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content.rstrip("\n") + "\n")
        written.append(rel)
    print("wrote:", ", ".join(written) or "(nothing)")
    missing = owned - set(written)
    if missing:
        print("MISSING:", ", ".join(sorted(missing)))
        return 4
    return 0


if __name__ == "__main__":
    sys.exit(main())
