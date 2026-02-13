/**
 * typewriter.js
 * Typewriter effect that cycles through an array of texts.
 */

const Typewriter = {
    /**
     * Start the typewriter effect.
     * @param {string} selector - CSS selector for the typewriter element.
     * @param {string[]} texts - Array of strings to type.
     */
    start(selector, texts) {
        const element = document.querySelector(selector);
        if (!element || !texts || texts.length === 0) return;

        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function type() {
            const currentText = texts[textIndex];

            if (isDeleting) {
                charIndex--;
                element.textContent = currentText.substring(0, charIndex);
            } else {
                charIndex++;
                element.textContent = currentText.substring(0, charIndex);
            }

            let typeSpeed = 150;

            if (isDeleting) {
                typeSpeed /= 2;
            }

            // If word is complete
            if (!isDeleting && charIndex === currentText.length) {
                typeSpeed = 2000;
                isDeleting = true;
            }
            // If word is deleted
            else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                typeSpeed = 500;
            }

            setTimeout(type, typeSpeed);
        }

        // Start the effect after a short delay
        setTimeout(type, 500);
    }
};

window.Typewriter = Typewriter;
