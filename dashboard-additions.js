// ===== APPEND TO dashboard.js =====
// These functions handle leaderboard display, sound effects, and Firebase integration
// Add this code to the end of dashboard.js

// ===== LEADERBOARD SYSTEM =====

async function loadLeaderboards() {
  // Load all three game leaderboards
  ['memory', 'logic', 'code'].forEach(gameKey => {
    loadGameLeaderboard(gameKey);
  });
}

async function loadGameLeaderboard(gameKey) {
  const leaderboardList = document.querySelector(`[data-leaderboard-list="${gameKey}"]`);
  if (!leaderboardList) return;

  // Show loading state
  leaderboardList.innerHTML = '<div class="leaderboard-loading"><p>Loading leaderboard...</p></div>';

  try {
    // Call Firebase function (from firebase-config.js)
    const topPlayers = await fetchLeaderboard(gameKey);

    if (topPlayers && topPlayers.length > 0) {
      leaderboardList.innerHTML = '';
      topPlayers.forEach((player, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'leaderboard-row';
        
        // Check if this is the current user
        if (currentUser && player.userId === currentUser.uid) {
          rowDiv.classList.add('current-user');
        }

        const rankClass = index < 3 ? 'top-3' : '';
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        const rankText = rankEmoji ? rankEmoji : `#${index + 1}`;

        rowDiv.innerHTML = `
          <div class="rank-badge ${rankClass} rank-${index + 1}">${rankText}</div>
          <div class="player-info">
            <div class="player-name">${player.name}</div>
            <div class="player-email">${player.email || ''}</div>
          </div>
          <div class="score-value">${player.score}</div>
          <div class="level-badge"><i class="ri-star-fill"></i> Lvl ${player.level}</div>
        `;
        leaderboardList.appendChild(rowDiv);
      });
    } else {
      leaderboardList.innerHTML = '<div class="leaderboard-loading"><p>No scores yet! Be the first to play.</p></div>';
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    leaderboardList.innerHTML = '<div class="leaderboard-loading"><p>Failed to load leaderboard</p></div>';
  }
}

// Setup leaderboard tab switching
document.addEventListener('DOMContentLoaded', () => {
  const leaderboardTabBtns = document.querySelectorAll('[data-leaderboard-filter]');
  const leaderboardBoards = document.querySelectorAll('[data-leaderboard-board]');

  leaderboardTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.leaderboardFilter;

      // Update active tab
      leaderboardTabBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      // Update visible board
      leaderboardBoards.forEach(board => {
        board.removeAttribute('data-active');
      });
      document.querySelector(`[data-leaderboard-board="${filter}"]`)?.setAttribute('data-active', 'true');

      // Reload that leaderboard's data
      loadGameLeaderboard(filter);
    });
  });

  // Initial load
  loadLeaderboards();
});

// ===== SOUND EFFECTS INTEGRATION =====

// Override finishGame to add sound and Firebase save
const originalFinishGame = finishGame;
finishGame = async function() {
  // Play success chime
  if (typeof gameSounds !== 'undefined') {
    gameSounds.playSuccessChime();
  }

  // Call original finish game
  originalFinishGame.call(this);

  // Save to Firebase
  setTimeout(async () => {
    if (typeof saveGameScore === 'undefined') {
      console.warn('Firebase not configured');
      return;
    }

    try {
      const gameKey = activeGame;
      const finalScore = score;
      const finalLevel = level;
      const finalStreak = streak;
      const correctAnswers = correctAnswerCount || Math.floor(score / 10);

      await saveGameScore(gameKey, finalScore, finalLevel, finalStreak, correctAnswers);
      
      // Refresh leaderboard
      loadGameLeaderboard(gameKey);
      
      // Show notification
      showToast(`🎉 Score saved! Check the leaderboards to see how you rank!`);
    } catch (error) {
      console.error('Failed to save game score:', error);
    }
  }, 500);
};

// Integrate sound effects into answer handling
const originalHandleAnswer = handleAnswer;
handleAnswer = function(isCorrect, feedback) {
  if (isCorrect) {
    if (typeof gameSounds !== 'undefined') {
      gameSounds.playCorrectSound();
    }
  } else {
    if (typeof gameSounds !== 'undefined') {
      gameSounds.playErrorSound();
    }
  }
  
  // Call original handler
  originalHandleAnswer.call(this, isCorrect, feedback);
};

// Play click sound on answer selection
const originalAddClickSoundToOptions = function() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('option-btn')) {
      if (typeof gameSounds !== 'undefined') {
        gameSounds.playClickSound();
      }
    }
  });
};

// Initialize sound effects integration
document.addEventListener('DOMContentLoaded', () => {
  originalAddClickSoundToOptions();
  
  // Add sound mute button to game modal
  const gameModal = document.querySelector('[data-game-modal]');
  if (gameModal) {
    const soundToggle = document.createElement('button');
    soundToggle.type = 'button';
    soundToggle.className = 'sound-toggle-btn';
    soundToggle.innerHTML = '<i class="ri-volume-high-line"></i>';
    soundToggle.setAttribute('aria-label', 'Toggle game sounds');
    soundToggle.setAttribute('title', 'Toggle sounds on/off');
    
    soundToggle.addEventListener('click', () => {
      if (typeof gameSounds !== 'undefined') {
        const isMuted = gameSounds.toggleMute();
        soundToggle.classList.toggle('is-muted', isMuted);
        soundToggle.innerHTML = isMuted 
          ? '<i class="ri-volume-mute-line"></i>' 
          : '<i class="ri-volume-high-line"></i>';
      }
    });
    
    // Add to game modal header
    const gameHeader = gameModal.querySelector('[data-game-header]');
    if (gameHeader) {
      gameHeader.appendChild(soundToggle);
    }
  }
});

// Timer countdown sound
const originalStartTimer = startTimer;
startTimer = function() {
  originalStartTimer.call(this);
  
  // Add countdown beep on last 3 seconds
  if (timeLeft <= 3 && typeof gameSounds !== 'undefined') {
    gameSounds.playCountdownBeep();
  }
};

// ===== USER STATS UPDATE =====

async function displayUserStats() {
  try {
    const stats = await fetchAllUserScores();
    
    if (stats && stats.length > 0) {
      const totalPoints = stats.reduce((sum, stat) => sum + (stat.score || 0), 0);
      const totalGames = stats.length;
      
      // Update user profile with stats if UI exists
      const userStatsElement = document.querySelector('[data-user-stats]');
      if (userStatsElement) {
        userStatsElement.innerHTML = `
          <div class="stat-card">
            <span>${totalPoints}</span>
            <label>Total Points</label>
          </div>
          <div class="stat-card">
            <span>${totalGames}</span>
            <label>Games Played</label>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Error fetching user stats:', error);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  displayUserStats();
});

// ===== END APPEND ===== 
