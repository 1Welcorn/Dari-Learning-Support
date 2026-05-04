const fs = require('fs');
const path = 'src/components/features/Activities.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const startIndex = lines.findIndex(l => l.includes('{(() => {')) + 1; // Line after 550
// Find the closing })()} for that block
let endIndex = -1;
let openBraces = 1;
for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].includes('{')) openBraces++;
    if (lines[i].includes('}')) openBraces--;
    if (openBraces === 0) {
        endIndex = i;
        break;
    }
}

if (startIndex > 0 && endIndex > 0) {
    const newBlock = `                       const medias = unit.external_links?.filter(l => l.label === 'media' || l.label === 'video_file' || l.label === 'video' || l.label === 'HTML') || [];
                       if (medias.length === 0) return null;

                       return (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                             {medias.map((media, mIdx) => {
                               const isCloudinary = media.url.includes('player.cloudinary.com');
                               const isVideo = media.label === 'video_file' || media.url.toLowerCase().endsWith('.mp4') || isCloudinary;

                               return (
                                 <div key={mIdx} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                   {isVideo ? (
                                      isCloudinary ? (
                                        <div style={{ width: media.width || '100%', borderRadius: '16px', overflow: 'hidden', background: '#000', margin: '0 auto' }}>
                                          <iframe src={media.url} style={{ width: '100%', height: '240px', border: 'none' }} allow="autoplay; fullscreen" />
                                        </div>
                                      ) : (
                                        <VideoPlayerV5 media={media} />
                                      )
                                   ) : media.label === 'HTML' ? (
                                      <div style={{ width: media.width || '100%', borderRadius: '24px', overflow: 'hidden', background: '#f8fafc', border: '2px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', margin: '0 auto' }}>
                                        <iframe 
                                          src={media.url} 
                                          style={{ width: '100%', height: '450px', border: 'none' }} 
                                          title="Atividade HTML"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                        />
                                      </div>
                                   ) : (
                                      <img src={media.url} alt="Media" className="word-game-icon-3d" style={{ width: media.width || 'auto', maxWidth: '100%' }} />
                                   )}
                                   
                                   {media.showSubtitles && media.caption && (
                                     <p style={{ 
                                       marginTop: '12px', 
                                       fontSize: '18px', 
                                       fontWeight: 600, 
                                       color: '#1e293b', 
                                       textAlign: 'center',
                                       background: 'rgba(255,255,255,0.8)',
                                       padding: '8px 20px',
                                       borderRadius: '12px',
                                       boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                       maxWidth: '90%'
                                     }}>
                                       {media.caption}
                                     </p>
                                   )}
                                 </div>
                               );
                             })}
                          </div>
                       );`;
    
    lines.splice(startIndex, endIndex - startIndex, newBlock);
    fs.writeFileSync(path, lines.join('\n'));
    console.log('Fixed');
} else {
    console.log('Could not find block');
}
