
import re

def patch_file_loose(path, pattern, replacement):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print(f"Error: Could not find pattern in {path}")
        return False
    
    new_content = content[:match.start()] + replacement + content[match.end():]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully patched {path}")
    return True

# index.css
pattern1 = r'\.nav-link-kids\s*\{.*?\}'
replacement1 = """.nav-link-kids {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    padding: 12px 20px;
    min-height: 80px; 
    width: 100%;
    max-width: 240px;
    margin: 0 auto 15px auto;
    text-decoration: none;
    color: white;
    font-weight: 900;
    font-size: 1.1rem;
    border-radius: 24px;
    border: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
    transition: all 0.2s ease;
}"""

pattern2 = r'\.nav-link-kids::before\s*\{.*?\}'
replacement2 = "/* Removed gloss */"

pattern3 = r'\.nav-link-kids:hover\s*\{.*?\}'
replacement3 = """.nav-link-kids:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0,0,0,0.15);
}"""

pattern4 = r'\.nav-link-kids\.active\s*\{.*?\}'
replacement4 = """.nav-link-kids.active {
    transform: translateY(2px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    filter: brightness(0.9);
}"""

patch_file_loose('src/index.css', pattern1, replacement1)
patch_file_loose('src/index.css', pattern2, replacement2)
patch_file_loose('src/index.css', pattern3, replacement3)
patch_file_loose('src/index.css', pattern4, replacement4)
