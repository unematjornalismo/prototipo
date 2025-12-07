const episodeManager = (() => {
    let currentBannerIndex = 0;
    let currentEpisodes = [];
    let currentBannerEpisode = null; 
    const bannerContent = document.getElementById('banner-content');
    const podcastImage = document.getElementById('podcast-image');
    const bannerArea = document.getElementById('banner-area');
    const bannerTitle = document.getElementById('banner-title');
    const bannerAuthor = document.getElementById('banner-author');
    const bannerDescription = document.getElementById('banner-description');
    const mainPlayBtn = document.getElementById('main-play-btn');
    const hintLeft = document.getElementById('banner-hint-left');
    const hintRight = document.getElementById('banner-hint-right');
    let bannerTimeout;
    
    const initializeEpisodeOrder = () => {
        // Pega todos os episódios disponíveis
        currentEpisodes = [...episodesData];
        console.log('Episódios disponíveis:', currentEpisodes.map(ep => ep.id));
        currentBannerEpisode = getBannerEpisode(); // Banner com base na quantidade de episódios
    };
    
    const getBannerEpisode = () => {
        // Se tiver apenas 1 episódio, retorna ele
        if (episodesData.length === 1) {
            return episodesData[0];
        }
        // Se tiver 2 ou mais, escolhe aleatoriamente
        const randomIndex = Math.floor(Math.random() * episodesData.length);
        return episodesData[randomIndex];
    };
    
    const getNextBannerEpisode = (currentEpisode) => {
        // Se tiver apenas 1 episódio, retorna o mesmo
        if (episodesData.length === 1) {
            return episodesData[0];
        }
        
        // Se tiver 2 ou mais, pega o próximo na sequência
        const currentIndex = episodesData.findIndex(ep => ep.id === currentEpisode.id);
        const nextIndex = (currentIndex + 1) % episodesData.length;
        return episodesData[nextIndex];
    };
    
    const getPrevBannerEpisode = (currentEpisode) => {
        // Se tiver apenas 1 episódio, retorna o mesmo
        if (episodesData.length === 1) {
            return episodesData[0];
        }
        
        // Se tiver 2 ou mais, pega o anterior na sequência
        const currentIndex = episodesData.findIndex(ep => ep.id === currentEpisode.id);
        const prevIndex = (currentIndex - 1 + episodesData.length) % episodesData.length;
        return episodesData[prevIndex];
    };
    
    const renderEpisodes = () => {
        const container = document.getElementById('episodes-container');
        container.innerHTML = '';
        
        // Se tiver menos de 3 episódios, mostra todos
        const episodesToShow = Math.min(currentEpisodes.length, 3);
        
        for (let i = 0; i < episodesToShow; i++) {
            const episode = currentEpisodes[i];
            const episodeElement = document.createElement('div');
            
            let displayDuration;
            if (episode.actualDuration) {
                displayDuration = formatDurationDisplay(episode.actualDuration);
            } else if (episode.formattedDurationMinutes) {
                displayDuration = episode.formattedDurationMinutes;
            } else {
                displayDuration = formatDurationMinutes(episode.defaultDuration);
            }
            
            const shortHash = getShortHash(episode.blockchainHash);
            const displayDate = episode.blockchainDate || episode.data;
            const displayInfo = `ID:${shortHash} - ${displayDate} - ${displayDuration}`;
            
            episodeElement.className = `episode episode-transition py-4 border-b border-gray-700 hover:bg-gray-800 rounded-lg px-4 cursor-pointer group relative ${i === 0 ? 'active-banner' : ''}`;
            episodeElement.dataset.episode = episode.id;
            episodeElement.dataset.position = i;
            
            episodeElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4 flex-1">
                        <!-- Ícone do episódio com imagem -->
                        <div class="flex-shrink-0">
                            <div class="w-10 h-10 rounded-full bg-cover bg-center" 
                                 style="background-image: url('${episode.imageUrl}'); background-size: cover; background-position: center center; background-repeat: no-repeat;">
                            </div>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <h3 class="font-semibold text-white text-lg truncate">${episode.nome}</h3>
                            <p class="text-gray-400 text-sm mt-1">${displayInfo}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <span class="text-gray-400 text-sm">${displayDuration}</span>
                        <!-- Ícone de play que aparece no hover -->
                        <button class="play-btn opacity-0 group-hover:opacity-100 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center transition-all duration-200 ml-4"
                                data-episode-id="${episode.id}">
                            <i class="fa-solid fa-play text-white text-xs ml-0.5"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Descrição do episódio -->
                <p class="text-gray-300 text-sm mt-2 leading-relaxed">${episode.descricao}</p>
            `;
            
            container.appendChild(episodeElement);
        }
        
        setupEpisodeListeners();
    };
    
    const setupEpisodeListeners = () => {
        const episodes = document.querySelectorAll('.episode');
        const playButtons = document.querySelectorAll('.play-btn');
        
        episodes.forEach(episode => {
            episode.addEventListener('click', (e) => {
                if (!e.target.closest('.play-btn')) {
                    const episodeId = parseInt(episode.dataset.episode);
                    const episodeData = episodesData.find(ep => ep.id === episodeId);
                    
                    if (episodeData && window.audioManager) {
                        playEpisode(episodeData, episode);
                    }
                }
            });
        });
        
        playButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const episodeId = parseInt(button.getAttribute('data-episode-id'));
                const episodeData = episodesData.find(ep => ep.id === episodeId);
                
                if (episodeData && window.audioManager) {
                    playEpisode(episodeData);
                }
            });
        });
    };
    
    const playEpisode = (episodeData, episodeElement = null) => {
        window.audioManager.loadEpisode(episodeData);
        window.audioManager.play();
        
        document.querySelectorAll('.episode').forEach(ep => {
            ep.classList.remove('episode-playing', 'bg-gray-700');
        });
        
        if (episodeElement) {
            episodeElement.classList.add('episode-playing', 'bg-gray-700');
        } else {
            const targetElement = document.querySelector(`[data-episode="${episodeData.id}"]`);
            if (targetElement) {
                targetElement.classList.add('episode-playing', 'bg-gray-700');
            }
        }
        
        updateBanner(episodeData);
        currentBannerEpisode = episodeData; 
        
        console.log(`Tocando: ${episodeData.nome}`);
    };
    
    const updateBanner = (episode) => {
        bannerTitle.textContent = episode.nome;
        
        if (bannerAuthor) {
            bannerAuthor.textContent = `por ${episode.autor}`;
        }
        
        bannerDescription.textContent = episode.descricao;
        
        // Atualiza a imagem do banner
        podcastImage.style.backgroundImage = `url('${episode.imageUrl}')`;
        podcastImage.className = `w-48 h-48 md:w-64 md:h-64 rounded-full shadow-lg flex-shrink-0 banner-transition bg-cover bg-center`;
        podcastImage.style.backgroundSize = 'cover';
        podcastImage.style.backgroundPosition = 'center center';
        podcastImage.style.backgroundRepeat = 'no-repeat';
        
        updateNavigationHints();
        
        currentBannerEpisode = episode;
        currentBannerIndex = episodesData.findIndex(ep => ep.id === episode.id);
    };
    
    const nextBanner = () => {
        // Se tiver apenas 1 episódio, não faz nada
        if (episodesData.length <= 1) return;
        
        const nextEpisode = getNextBannerEpisode(currentBannerEpisode);
        changeBanner(nextEpisode);
    };
    
    const prevBanner = () => {
        // Se tiver apenas 1 episódio, não faz nada
        if (episodesData.length <= 1) return;
        
        const prevEpisode = getPrevBannerEpisode(currentBannerEpisode);
        changeBanner(prevEpisode);
    };
    
    const changeBanner = (episode) => {
        currentBannerEpisode = episode;
        currentBannerIndex = episodesData.findIndex(ep => ep.id === episode.id);
        
        bannerContent.classList.remove('banner-visible');
        bannerContent.classList.add('banner-hidden');
        
        setTimeout(() => {
            updateBanner(episode);
            bannerContent.classList.remove('banner-hidden');
            bannerContent.classList.add('banner-visible');
            
            // Reinicia a rotação automática apenas se tiver 2 ou mais episódios
            if (episodesData.length >= 2) {
                resetAutoRotation();
            }
        }, 300);
    };
    
    const updateNavigationHints = () => {
        // Se tiver apenas 1 episódio, esconde as setas
        if (episodesData.length <= 1) {
            hintLeft.style.display = 'none';
            hintRight.style.display = 'none';
        } else {
            hintLeft.style.display = 'block';
            hintRight.style.display = 'block';
            hintLeft.style.opacity = '1';
            hintRight.style.opacity = '1';
        }
    };
    
    const setupBannerNavigation = () => {
        // Se tiver apenas 1 episódio, não configura navegação
        if (episodesData.length <= 1) return;
        
        bannerArea.addEventListener('mousemove', (e) => {
            const bannerRect = bannerArea.getBoundingClientRect();
            const relativeX = e.clientX - bannerRect.left;
            const bannerWidth = bannerRect.width;
            const threshold = bannerWidth / 3;
            
            clearTimeout(bannerTimeout);
            
            if (relativeX < threshold) {
                hintLeft.style.opacity = '1';
                hintRight.style.opacity = '0.5';
                setTimeout(() => prevBanner(), 500);
            } else if (relativeX > bannerWidth - threshold) {
                hintLeft.style.opacity = '0.5';
                hintRight.style.opacity = '1';
                setTimeout(() => nextBanner(), 500);
            } else {
                hintLeft.style.opacity = '0.5';
                hintRight.style.opacity = '0.5';
                resetAutoRotation();
            }
        });
        
        bannerArea.addEventListener('mouseleave', () => {
            hintLeft.style.opacity = '0.5';
            hintRight.style.opacity = '0.5';
            resetAutoRotation();
        });
        
        // Adiciona clique nas setas
        hintLeft.addEventListener('click', (e) => {
            e.stopPropagation();
            prevBanner();
        });
        
        hintRight.addEventListener('click', (e) => {
            e.stopPropagation();
            nextBanner();
        });
    };
    
    const setupBannerPlay = () => {
        mainPlayBtn.addEventListener('click', () => {
            if (currentBannerEpisode && window.audioManager) {
                playEpisode(currentBannerEpisode);
            }
        });
    };
    
    const resetAutoRotation = () => {
        clearTimeout(bannerTimeout);
        
        // Inicia rotação automática apenas se tiver 2 ou mais episódios
        if (episodesData.length >= 2) {
            startAutoRotation();
        }
    };
    
    const startAutoRotation = () => {
        // Apenas inicia rotação automática se tiver 2 ou mais episódios
        if (episodesData.length >= 2) {
            bannerTimeout = setTimeout(() => {
                nextBanner();
            }, 8000); // 8 segundos entre mudanças
        }
    };
    
    const init = () => {
        if (typeof episodesData === 'undefined' || episodesData.length === 0) {
            setTimeout(init, 100);
            return;
        }
        
        console.log(`Inicializando com ${episodesData.length} episódio(s)`);
        
        initializeEpisodeOrder();
        renderEpisodes();
        setupBannerNavigation();
        setupBannerPlay();
        
        // Define o episódio inicial do banner
        const initialBannerEpisode = getBannerEpisode();
        updateBanner(initialBannerEpisode);
        updateNavigationHints();
        
        // Inicia rotação automática apenas se tiver 2 ou mais episódios
        if (episodesData.length >= 2) {
            startAutoRotation();
        }
        
        console.log('Sistema de episódios inicializado');
        console.log('Episódios disponíveis:', episodesData.length);
        console.log('Episódio inicial do banner:', initialBannerEpisode.nome);
        console.log('Rotação automática:', episodesData.length >= 2 ? 'Ativada (8s)' : 'Desativada (apenas 1 episódio)');
    };
    
    return {
        init,
        nextBanner,
        prevBanner,
        playEpisode
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    episodeManager.init();
});

const formatDurationDisplay = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDurationMinutes = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0 min';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
};

const getShortHash = (hash) => {
    if (!hash || typeof hash !== 'string') return '000';
    return hash.substring(0, 3).toUpperCase();
};