
import re

def patch_file_regex(path, pattern, replacement):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if not re.search(pattern, content):
        print(f"Error: Could not find pattern in {path}")
        return False
    
    new_content = re.sub(pattern, replacement, content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully patched {path}")
    return True

# PlanningEditor.tsx
# Find the select for frameColor and add delay after it
pattern1 = r'(<select value={link\.frameColor \|\| \'\'}.*?</select>)'
replacement1 = r'\1\n                           <div style={{ display: \'flex\', justifyContent: \'space-between\', fontSize: \'10px\', fontWeight: 900 }}><span>DELAY DE INÍCIO: {link.delay || 0}s</span></div>\n                           <input type="range" min="0" max="15" step="0.5" value={link.delay || 0} style={{ width: \'100%\' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].delay = parseFloat(e.target.value); setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} />'

# Activities.tsx
pattern2 = r'(<select value={link\.frameColor \|\| \'\'}.*?</select>)\n\s*</div>'
replacement2 = r'\1\n                           </div>\n                           <div className="control-group">\n                              <div style={{ display: \'flex\', justifyContent: \'space-between\', fontSize: \'11px\', fontWeight: 900, color: \'#64748b\', marginBottom: \'4px\' }}><span>DELAY DE INÍCIO: {link.delay || 0}s</span></div>\n                              <input type="range" min="0" max="15" step="0.5" value={link.delay || 0} style={{ width: \'100%\', accentColor: \'#10b981\' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].delay = parseFloat(e.target.value); setTempLinks(nl); }} />'

patch_file_regex('src/components/features/PlanningEditor.tsx', pattern1, replacement1)
patch_file_regex('src/components/features/Activities.tsx', pattern2, replacement2)
