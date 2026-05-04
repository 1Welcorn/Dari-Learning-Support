const fs = require('fs');
const path = 'src/components/features/Activities.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                    {(() => {
                       const mainMedia = unit.external_links?.find(l => l.label === 'media' || l.label === 'video_file' || l.label === 'video' || l.label === 'HTML');
                       if (!mainMedia) return null;
                       const isCloudinary = mainMedia.url.includes('player.cloudinary.com');
                       const isVideo = mainMedia.label === 'video_file' || mainMedia.url.toLowerCase().endsWith('.mp4') || isCloudinary;

                       return (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                             {isVideo ? (
                               isCloudinary ? (
                                 (() => {
                                   try {
                                     const urlObj = new URL(mainMedia.url);
                                     const cloudName = urlObj.searchParams.get('cloud_name');
                                     const publicId = urlObj.searchParams.get('public_id');
                                     if (cloudName && publicId) {
                                       const directUrl = \`https://res.cloudinary.com/\${cloudName}/video/upload/\${publicId}.mp4\`;
                                       return <VideoPlayerV5 media={{ ...mainMedia, url: directUrl }} />;
                                     }
                                   } catch (e) {
                                     console.error("Erro ao converter URL do Cloudinary", e);
                                   }
                                   return (
                                     <div style={{ width: mainMedia.width || '100%', borderRadius: '16px', overflow: 'hidden', background: '#000', margin: '0 auto' }}>
                                       <iframe src={mainMedia.url} style={{ width: '100%', height: '240px', border: 'none' }} allow="autoplay; fullscreen" />
                                     </div>
                                   );
                                 })()
                               ) : (
                                 <VideoPlayerV5 media={mainMedia} />
                               )
                             ) : mainMedia.label === 'HTML' ? (
                                <div style={{ width: mainMedia.width || '100%', borderRadius: '24px', overflow: 'hidden', background: '#f8fafc', border: '2px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', margin: '0 auto' }}>
                                  <iframe 
                                    src={mainMedia.url} 
                                    style={{ width: '100%', height: '450px', border: 'none' }} 
                                    title="Atividade HTML"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              ) : (
                               <img src={mainMedia.url} alt="Media" className="word-game-icon-3d" style={{ width: mainMedia.width || 'auto', maxWidth: '100%' }} />
                             )}
                             
                             {mainMedia.showSubtitles && mainMedia.caption && (
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
                                 {mainMedia.caption}
                               </p>
                             )}
                          </div>
                       );
                    })()}`;

const replacement = \`                    {(() => {
                       const medias = unit.external_links?.filter(l => l.label === 'media' || l.label === 'video_file' || l.label === 'video' || l.label === 'HTML') || [];
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
                       );
                    })()}\`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Success');
} else {
    console.log('Target not found');
}
