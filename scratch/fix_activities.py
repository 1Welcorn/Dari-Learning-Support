import sys

path = 'src/components/features/Activities.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to remove from index 604 (line 605) to index 624 (line 625)
# BUT we want to KEEP the closing line })()} which is currently at 625

new_lines = lines[:604] + [lines[624]] + lines[625:]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Fixed")
