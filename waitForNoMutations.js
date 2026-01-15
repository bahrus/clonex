/**
 * Waits for DOM mutations to settle using MutationObserver
 * @param {DocumentFragment} fragment - The fragment to observe
 * @param {number} debounceMs - Debounce interval in milliseconds
 * @returns {Promise<void>}
 */
export function waitForNoMutations(fragment, debounceMs) {
    return new Promise((resolve) => {
        let timeoutId;
        
        const observer = new MutationObserver(() => {
            // Clear existing timeout
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
            
            // Set new timeout
            timeoutId = setTimeout(() => {
                observer.disconnect();
                resolve();
            }, debounceMs);
        });
        
        // Observe all child elements in the fragment
        const childElements = fragment.querySelectorAll('*');
        for (const element of childElements) {
            observer.observe(element, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true
            });
        }
        
        // Also observe the fragment itself if it has children
        if (fragment.childNodes.length > 0) {
            for (const child of fragment.childNodes) {
                if (child instanceof Element) {
                    observer.observe(child, {
                        attributes: true,
                        childList: true,
                        subtree: true,
                        characterData: true
                    });
                }
            }
        }
        
        // Start the initial timeout in case no mutations occur
        timeoutId = setTimeout(() => {
            observer.disconnect();
            resolve();
        }, debounceMs);
    });
}