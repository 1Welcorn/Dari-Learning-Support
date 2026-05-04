const fs = require('fs');
const path = 'src/components/features/Activities.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<span>Legenda<\/span>\s*<\/label>\s*<button className="del-media-btn"/;

const replacement = `<span>Legenda</span>
                                       </label>
                                       <label className="playback-check" style={{ color: '#3b82f6', fontWeight: 800 }}>
                                          <input 
                                             type="checkbox" 
                                             checked={link.autoPlayOnce || false} 
                                             onChange={(e) => {
                                                const newLinks = [...tempLinks];
                                                newLinks[idx].autoPlayOnce = e.target.checked;
                                                setTempLinks(newLinks);
                                             }}
                                          />
                                          <span>Auto-Play ✨</span>
                                       </label>
                                       <div className="width-control-v5" style={{ marginLeft: '10px' }}>
                                          <span>Espera:</span>
                                          <input 
                                             type="range" min="0" max="10" step="1"
                                             value={link.delay || 0}
                                             onChange={(e) => {
                                                const newLinks = [...tempLinks];
                                                newLinks[idx].delay = parseInt(e.target.value);
                                                setTempLinks(newLinks);
                                             }}
                                             style={{ accentColor: '#f59e0b', width: '60px' }}
                                          />
                                          <span className="width-val">{link.delay || 0}s</span>
                                       </div>
                                      <button className="del-media-btn"`;

if (regex.test(content)) {
    fs.writeFileSync(path, content.replace(regex, replacement));
    console.log('Success!');
} else {
    console.log('Target not found');
}
