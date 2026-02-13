/**
 * Cursor Glow Effect
 * Creates a soft radial spotlight that follows the mouse cursor
 */
(function () {
    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    document.getElementById('app').appendChild(glow);

    let mouseX = -500, mouseY = -500;
    let currentX = -500, currentY = -500;
    const lerpFactor = 0.12; // Smooth follow speed

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    document.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        glow.style.opacity = '1';
    });

    function animate() {
        currentX += (mouseX - currentX) * lerpFactor;
        currentY += (mouseY - currentY) * lerpFactor;

        glow.style.transform = `translate(${currentX}px, ${currentY}px)`;

        requestAnimationFrame(animate);
    }

    // Hide during onboarding
    function checkOnboarding() {
        const onboarding = document.getElementById('onboarding');
        if (onboarding && !onboarding.classList.contains('hidden')) {
            glow.style.display = 'none';
        } else {
            glow.style.display = '';
        }
    }

    // Observe onboarding visibility changes
    const onboarding = document.getElementById('onboarding');
    if (onboarding) {
        const observer = new MutationObserver(checkOnboarding);
        observer.observe(onboarding, { attributes: true, attributeFilter: ['class'] });
    }

    checkOnboarding();
    requestAnimationFrame(animate);
})();
