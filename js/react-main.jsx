import React from 'react'
import ReactDOM from 'react-dom/client'
import Ballpit from './components/BallpitNew'
import Aurora from './components/Aurora'

ReactDOM.createRoot(document.getElementById('react-background')).render(
    <React.StrictMode>
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Ballpit
                followCursor={false}
                count={100}
                colors={['#E6B0AA', '#D98880', '#F8F9FA', '#FADBD8']}
                ambientColor={0xffffff}
                ambientIntensity={0.5}
                lightIntensity={200}
                maxSize={1}
                minSize={0.5}
                gravity={0.01}
                friction={0.9975}
                wallBounce={0.95}
                controlSphere0={false}
            />
        </div>
    </React.StrictMode>,
)


const auroraRoot = document.getElementById('aurora-background');
if (auroraRoot) {
    ReactDOM.createRoot(auroraRoot).render(
        <React.StrictMode>
            <Aurora
                colorStops={['#F8F9FA', '#D8B4FE', '#A855F7']}
                speed={0.5}
                amplitude={0.5}
            />
        </React.StrictMode>
    );
}
