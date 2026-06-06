// Script para alternar el ícono de foco
const container = document.querySelector('.lightbulb-container');
const icons = container.querySelectorAll('i');

container.addEventListener('mouseenter', () => {
  icons[0].style.display = 'none'; 
  icons[1].style.display = 'inline'; 
});

container.addEventListener('mouseleave', () => {
  icons[0].style.display = 'inline'; 
  icons[1].style.display = 'none'; 
});
 