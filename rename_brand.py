import os
import glob

replacements = [
    ("Broderie Numérique", "Broderie Numérique"),
    ("BroderieNumerique", "BroderieNumerique"),
    ("broderienumerique", "broderienumerique")
]

# We need to target specific file types
files_to_check = []
for ext in ["*.html", "*.js", "*.py", "*.md", "*.yml"]:
    # Include admin subfolder too
    files_to_check.extend(glob.glob(f"**/{ext}", recursive=True))

for file_path in files_to_check:
    # Skip the python script itself and node_modules/venv if any
    if "replace.py" in file_path or "split_json.py" in file_path or "build.py" in file_path:
        continue
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        new_content = content
        for old, new in replacements:
            new_content = new_content.replace(old, new)
            
        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {file_path}")
    except Exception as e:
        print(f"Failed {file_path}: {e}")
