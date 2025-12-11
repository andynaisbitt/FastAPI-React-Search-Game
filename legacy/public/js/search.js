document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const searchForm = document.getElementById('searchForm');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const chalkboardCanvas = document.getElementById('chalkboardCanvas');

  function toggleSearchLoadingState(isLoading) {
    searchInput.disabled = isLoading;
    loadingIndicator.style.display = isLoading ? 'block' : 'none';
  }

  searchInput.addEventListener('input', function() {
    const text = this.value;
    drawChalkText(text);
    // Audio disabled - browsers block autoplay
    // playSound('chalk');
  });

  searchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    toggleSearchLoadingState(true);
    const query = searchInput.value;
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  });

  function drawChalkText(text) {
    const ctx = chalkboardCanvas.getContext('2d');
    ctx.clearRect(0, 0, chalkboardCanvas.width, chalkboardCanvas.height);
    ctx.font = '24px Architects Daughter';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, chalkboardCanvas.width / 2, chalkboardCanvas.height / 2);
  }

  function playSound(sound) {
    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.play();
  }
});