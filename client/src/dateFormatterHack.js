// A global script to enforce dd/mm/yyyy on all native date inputs across browsers
export function initDateFormatter() {
  const updateDateFormat = (input) => {
    if (input.value) {
      const parts = input.value.split('-');
      if (parts.length === 3) {
        input.setAttribute('data-date', `${parts[2]}/${parts[1]}/${parts[0]}`);
      } else {
        input.setAttribute('data-date', 'dd/mm/yyyy');
      }
    } else {
      input.setAttribute('data-date', 'dd/mm/yyyy');
    }
  };

  // Listen for user interactions
  document.addEventListener('change', (e) => {
    if (e.target && e.target.type === 'date') {
      updateDateFormat(e.target);
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target && e.target.type === 'date') {
      updateDateFormat(e.target);
    }
  });

  // Observe dynamically added inputs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'INPUT' && node.type === 'date') {
              updateDateFormat(node);
            }
            if (node.querySelectorAll) {
              node.querySelectorAll('input[type="date"]').forEach(updateDateFormat);
            }
          }
        });
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Intercept React programmatic value changes
  const inputDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  if (inputDescriptor) {
    const originalSetter = inputDescriptor.set;
    Object.defineProperty(HTMLInputElement.prototype, 'value', {
      set(val) {
        if (originalSetter) originalSetter.call(this, val);
        if (this.type === 'date') {
          updateDateFormat(this);
        }
      },
      get() {
        return inputDescriptor.get.call(this);
      }
    });
  }
}
