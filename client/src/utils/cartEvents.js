// Cart event helper to open cart panel from anywhere
export const openCartPanel = () => {
    window.dispatchEvent(new Event('openCartPanel'));
};

export const closeCartPanel = () => {
    window.dispatchEvent(new Event('closeCartPanel'));
};
