window.addEventListener('message', function(event) {
    if (event.data === 'scrollToSection1') {
      document.querySelector('#our-team').scrollIntoView({ behavior: 'smooth' });
    }
  });