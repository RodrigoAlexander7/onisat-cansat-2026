const TEAM = [
  {
    name: 'Diana Huanqui Chirme',
    img: 'imgs/diana.png',
    linkedin: 'https://linkedin.com/in/diana-huanqui',
  },
  {
    name: 'Edison Velzco Huama',
    img: 'imgs/edison.png',
    linkedin: 'https://linkedin.com/in/edison-velzco',
  },
  {
    name: 'Wendy Vilca Luna',
    img: 'imgs/wendy.png',
    linkedin: 'https://linkedin.com/in/wendy-vilca',
  },
  {
    name: 'Brian Sanchez Montoya',
    img: 'imgs/brian.png',
    linkedin: 'https://linkedin.com/in/brian-sanchez',
  },
  {
    name: 'Alex Torres Guzman',
    img: 'imgs/alex.png',
    linkedin: 'https://linkedin.com/in/alex-torres',
  },
  {
    name: 'Michael Checa Huamani',
    img: 'imgs/michael.png',
    linkedin: 'https://linkedin.com/in/michael-checa',
  },
  {
    name: 'Rodrigo Fernandez Huarca',
    img: 'imgs/rodrigo.png',
    linkedin: 'https://linkedin.com/in/rodrigo-fernandez',
  },
];

function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2);
}

function linkedinIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>`;
}

function renderTeam() {
  const grid = document.getElementById('team-grid');
  grid.innerHTML = TEAM.map(member => {
    const initials = getInitials(member.name);
    return `
      <div class="team-card">
        <img
          src="${member.img}"
          alt="${member.name}"
          class="team-photo"
          loading="lazy"
          onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div class="team-photo-fallback" style="display:none;">${initials}</div>
        <h3>${member.name}</h3>
        <div class="team-links">
          <a href="${member.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de ${member.name}">
            ${linkedinIcon()}
          </a>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', renderTeam);
