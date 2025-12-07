class Blockchain {
    constructor() {
        this.chain = [];
        this.transactions = [];
        this.createBlock(1, '0');
    }

    createBlock(proof, previous_hash) {
        const timestamp = new Date().toISOString();
        const block = {
            'index': this.chain.length + 1,
            'timestamp': timestamp,
            'proof': proof,
            'previous_hash': previous_hash,
            'transactions': [...this.transactions],
            'hash': '0'.repeat(64)
        };
        
        this.transactions = [];
        this.chain.push(block);
        
        return this.hash(block).then(realHash => {
            block.hash = realHash;
            return block;
        });
    }

    get_previous_block() {
        return this.chain[this.chain.length - 1];
    }

    hash(block) {
        const blockCopy = {...block};
        blockCopy.hash = '';
        const encodedBlock = JSON.stringify(blockCopy, Object.keys(blockCopy).sort());
        return this.sha256(encodedBlock);
    }

    sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        return crypto.subtle.digest('SHA-256', msgBuffer).then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        });
    }

    async addMusicTransaction(musicData) {
        const previous_block = this.get_previous_block();
        const proof = previous_block.proof + 1;
        
        this.transactions.push({
            'type': 'music_creation',
            'music_id': musicData.id,
            'name': musicData.nome,
            'timestamp': new Date().toISOString()
        });

        const previous_hash = previous_block.hash;
        const newBlock = await this.createBlock(proof, previous_hash);
        
        return newBlock;
    }

    async getMusicHash(musicId) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        for (let block of this.chain) {
            for (let transaction of block.transactions) {
                if (transaction.music_id === musicId && block.hash && block.hash !== '0'.repeat(64)) {
                    return {
                        hash: block.hash,
                        timestamp: block.timestamp,
                        blockIndex: block.index
                    };
                }
            }
        }
        return null;
    }
}

const blockchain = new Blockchain();

const formatBlockchainDate = (timestamp) => {
    try {
        const date = new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('pt-BR', { month: 'short' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    } catch (error) {
        return 'Data inválida';
    }
};

const getAudioDuration = (audioUrl) => {
    return new Promise((resolve) => {
        const audio = new Audio();
        
        const timeout = setTimeout(() => {
            console.warn(`Timeout ao carregar áudio: ${audioUrl}`);
            audio.src = '';
            resolve(generateRandomDuration());
        }, 5000);

        audio.addEventListener('loadedmetadata', () => {
            clearTimeout(timeout);
            const duration = Math.floor(audio.duration);
            console.log(`Duração obtida com sucesso: ${audioUrl} - ${duration}s`);
            audio.src = '';
            resolve(duration);
        });

        

        audio.preload = 'metadata';
        audio.src = audioUrl;
        audio.load();
    });
};

const generateRandomDuration = () => {
    return Math.floor(Math.random() * (360 - 180) + 180);
};

let episodesData = [
    {
        id: 1,
        nome: "1.Apresentação",
        autor: "Thiago Smaykel, Ayana, Fernanda,",
        data: "12 Nov 2025",
        descricao: "aduio",
        audio: "audios/Avant_Jazz.mp3",
        imageUrl: "https://cdn.pixabay.com/photo/2023/10/07/10/01/ai-generated-8299888_1280.jpg",
        bannerGradient: "gradient-1",
        defaultDuration: 300
    }//,
    // {
    //     id: 2,
    //     nome: "2. Valse Gymnopedie", 
    //     autor: "Kevin MacLeod",
    //     data: "5 Nov 2025",
    //     descricao: "This is Gymnopedie #1 from Erik Satie (1888), but it has a beat and you can dance to it.",
    //     audio: "audios/Valse_Gymnopedie.mp3",
    //     imageUrl: "https://cdn.pixabay.com/photo/2023/10/07/10/01/ai-generated-8299888_1280.jpg",
    //     bannerGradient: "gradient-2",
    //     defaultDuration: 270
    // },
    // {
    //     id: 3,
    //     nome: "3. Pleasant Porridge",
    //     autor: "Kevin MacLeod",
    //     data: "29 Out 2025",
    //     descricao: "The show will begin shortly.",
    //     audio: "audios/Pleasant_Porridge.mp3",
    //     imageUrl: "https://cdn.pixabay.com/photo/2023/10/07/10/01/ai-generated-8299888_1280.jpg",
    //     bannerGradient: "gradient-3",
    //     defaultDuration: 288
    // },
    // {
    //     id: 4,
    //     nome: "4. Night in Venice",
    //     autor: "Kevin MacLeod",
    //     data: "22 Out 2025",
    //     descricao: "Just your run of the mill nice jazz; processed to sound a lot older than it is.",
    //     audio: "audios/Night_in_Venice.mp3",
    //     imageUrl: "https://cdn.pixabay.com/photo/2023/10/07/10/01/ai-generated-8299888_1280.jpg",
    //     bannerGradient: "gradient-4",
    //     defaultDuration: 312
    // },
    // {
    //     id: 5,
    //     nome: "5. Plain Loafer",
    //     autor: "Kevin MacLeod",
    //     data: "15 Out 2025",
    //     descricao: "Sort of rock, but not. Neither is this jazz or funk... I really don't know what this is... but it is kind of fun.",
    //     audio: "audios/Plain_Loafer.mp3",
    //     imageUrl: "https://cdn.pixabay.com/photo/2023/10/07/10/01/ai-generated-8299888_1280.jpg",
    //     bannerGradient: "gradient-5",
    //     defaultDuration: 282
    // }
];

async function initializeBlockchainWithMusics() {
    console.log('Inicializando blockchain...');
    
    for (let episode of episodesData) {
        try {
            await blockchain.addMusicTransaction(episode);
            console.log(`Música ${episode.id} registrada`);
        } catch (error) {
            console.error(`Erro ao registrar música ${episode.id}:`, error);
        }
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
    await updateEpisodesWithBlockchainData();
    await updateEpisodesWithRealAudioDurations();
    
    console.log('Blockchain inicializado!');
}

async function updateEpisodesWithBlockchainData() {
    console.log('Atualizando dados do blockchain...');
    
    for (let episode of episodesData) {
        try {
            const blockchainData = await blockchain.getMusicHash(episode.id);
            
            if (blockchainData) {
                episode.blockchainHash = blockchainData.hash;
                episode.blockchainDate = formatBlockchainDate(blockchainData.timestamp);
                episode.blockIndex = blockchainData.blockIndex;
            } else {
                episode.blockchainHash = '00000000000000000000000000000000';
                episode.blockchainDate = episode.data;
                episode.blockIndex = 0;
            }
        } catch (error) {
            console.error(`Erro no episódio ${episode.id}:`, error);
        }
    }
    
    // Reaplica a pesquisa se estiver pesquisando
    if (window.searchSystem && window.searchSystem.reapplySearchIfNeeded) {
        window.searchSystem.reapplySearchIfNeeded();
    }
}

async function updateEpisodesWithRealAudioDurations() {
    console.log('Obtendo durações reais dos áudios...');
    
    const durationPromises = episodesData.map(async (episode) => {
        try {
            const actualDuration = await getAudioDuration(episode.audio);
            episode.actualDuration = actualDuration;
            episode.audioDuration = actualDuration;
            return { episodeId: episode.id, success: true, duration: actualDuration };
        } catch (error) {
            episode.actualDuration = episode.defaultDuration;
            episode.audioDuration = episode.defaultDuration;
            return { episodeId: episode.id, success: false, duration: episode.defaultDuration };
        }
    });
    
    await Promise.allSettled(durationPromises);
    
    
    if (window.searchSystem && window.searchSystem.reapplySearchIfNeeded) {
        window.searchSystem.reapplySearchIfNeeded();
    }
}

const audioManager = (() => {
    const audioElement = document.getElementById('audio-element');
    const player = document.getElementById('audio-player');
    const currentTrack = document.getElementById('current-track');
    const currentPodcast = document.getElementById('current-podcast');
    const currentTime = document.getElementById('current-time');
    const duration = document.getElementById('duration');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const playerPlayBtn = document.getElementById('player-play-btn');
    const currentEpisodeImage = document.getElementById('current-episode-image');
    const closePlayerBtn = document.getElementById('close-player-btn');
    const backwardBtn = document.getElementById('backward-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const volumeBtn = document.getElementById('volume-btn');
    const volumeLevel = document.getElementById('volume-level');
    const volumeContainer = document.getElementById('volume-container');
    
    let isPlaying = false;
    let currentEpisode = null;
    let currentEpisodeIndex = 0;
    let progressInterval;
    let isDragging = false;
    let isRepeating = false;
    let isShuffling = false;
    let volume = 70;
    let isMuted = false;
    let originalEpisodeOrder = [...episodesData];

    // Funções auxiliares para shuffle
    const shuffleEpisodes = () => {
        // Embaralha o array de episódios usando Fisher-Yates
        for (let i = episodesData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [episodesData[i], episodesData[j]] = [episodesData[j], episodesData[i]];
        }
        
        // Atualiza a interface se necessário
        if (window.searchSystem && !window.searchSystem.isSearching()) {
            updateEpisodesDisplay();
        }
    };

    const restoreOriginalOrder = () => {
        episodesData = [...originalEpisodeOrder];
        
        // Atualiza a interface se necessário
        if (window.searchSystem && !window.searchSystem.isSearching()) {
            updateEpisodesDisplay();
        }
    };

    const disableRepeat = () => {
        isRepeating = false;
        const icon = repeatBtn.querySelector('i');
        audioElement.loop = false;
        icon.classList.remove('text-green-500');
        icon.classList.add('text-gray-400');
        console.log('Repeat desativado automaticamente');
    };

    const disableShuffle = () => {
        isShuffling = false;
        const icon = shuffleBtn.querySelector('i');
        icon.classList.remove('text-green-500');
        icon.classList.add('text-gray-400');
        shuffleBtn.title = 'Ativar reprodução aleatória';
        restoreOriginalOrder();
        console.log('Shuffle desativado automaticamente');
    };

    // Função para atualizar a exibição dos episódios
    const updateEpisodesDisplay = () => {
        if (window.searchSystem && window.searchSystem.reapplySearchIfNeeded) {
            window.searchSystem.reapplySearchIfNeeded();
        }
    };

    const getNextEpisode = () => {
        if (!currentEpisode) return episodesData[0];
        
        if (isShuffling) {
            // No modo shuffle, pega o próximo episódio na ordem embaralhada
            const currentIndex = episodesData.findIndex(ep => ep.id === currentEpisode);
            const nextIndex = (currentIndex + 1) % episodesData.length;
            return episodesData[nextIndex];
        } else {
            // No modo normal, pega o próximo episódio na ordem original
            const currentEpisodeData = episodesData.find(ep => ep.id === currentEpisode);
            const currentId = currentEpisodeData.id;
            const nextId = (currentId % episodesData.length) + 1;
            return episodesData.find(ep => ep.id === nextId) || episodesData[0];
        }
    };

    const getPreviousEpisode = () => {
        if (!currentEpisode) return episodesData[0];
        
        if (isShuffling) {
            // No modo shuffle, pega o episódio anterior na ordem embaralhada
            const currentIndex = episodesData.findIndex(ep => ep.id === currentEpisode);
            const previousIndex = (currentIndex - 1 + episodesData.length) % episodesData.length;
            return episodesData[previousIndex];
        } else {
            // No modo normal, pega o episódio anterior na ordem original
            const currentEpisodeData = episodesData.find(ep => ep.id === currentEpisode);
            const currentId = currentEpisodeData.id;
            const previousId = currentId - 1 > 0 ? currentId - 1 : episodesData.length;
            return episodesData.find(ep => ep.id === previousId) || episodesData[episodesData.length - 1];
        }
    };

    const playNextEpisode = () => {
        if (isRepeating) {
            play();
            return;
        }
        
        const nextEpisode = getNextEpisode();
        if (nextEpisode) {
            console.log(`Indo para próxima: "${nextEpisode.nome}"`);
            
            loadEpisode(nextEpisode);
            play();
            
            if (window.episodeManager) {
                window.episodeManager.playEpisode(nextEpisode);
            }
        }
    };

    const playPreviousEpisode = () => {
        const previousEpisode = getPreviousEpisode();
        if (previousEpisode) {
            console.log(`Voltando para: "${previousEpisode.nome}"`);
            
            loadEpisode(previousEpisode);
            play();
            
            if (window.episodeManager) {
                window.episodeManager.playEpisode(previousEpisode);
            }
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    
    const updateProgress = () => {
        if (audioElement.duration && !isDragging) {
            const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
            currentTime.textContent = formatTime(audioElement.currentTime);
        }
    };
    
    const setDuration = () => {
        if (audioElement.duration) {
            duration.textContent = formatTime(audioElement.duration);
        } else {
            const currentEpisodeData = episodesData.find(ep => ep.id === currentEpisode);
            if (currentEpisodeData && currentEpisodeData.actualDuration) {
                duration.textContent = formatTime(currentEpisodeData.actualDuration);
            } else {
                duration.textContent = "5:00";
            }
        }
    };
    
    const setupProgressBar = () => {
        let isMouseDown = false;
        const seek = (clientX) => {
            const rect = progressContainer.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const totalDuration = audioElement.duration || 300;
            const newTime = percent * totalDuration;
            audioElement.currentTime = newTime;
            progressBar.style.width = `${percent * 100}%`;
            currentTime.textContent = formatTime(newTime);
        };
        
        progressContainer.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            isDragging = true;
            progressContainer.classList.add('dragging');
            seek(e.clientX);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                seek(e.clientX);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isMouseDown = false;
            isDragging = false;
            progressContainer.classList.remove('dragging');
        });
    };
    
    const setupVolumeControls = () => {
        const setVolume = (newVolume) => {
            volume = Math.max(0, Math.min(100, newVolume));
            audioElement.volume = volume / 100;
            
            // Sempre horizontal
            volumeLevel.style.width = `${volume}%`;
            volumeLevel.style.height = '100%';
            
            if (volume === 0) {
                isMuted = true;
                volumeBtn.querySelector('i').className = 'fa-solid fa-volume-xmark text-lg';
            } else {
                isMuted = false;
                volumeBtn.querySelector('i').className = 'fa-solid fa-volume-high text-lg';
            }
        };
        
        const toggleMute = () => {
            isMuted = !isMuted;
            if (isMuted) {
                audioElement.volume = 0;
                volumeBtn.querySelector('i').className = 'fa-solid fa-volume-xmark text-lg';
                volumeLevel.style.width = '0%';
            } else {
                audioElement.volume = volume / 100;
                volumeBtn.querySelector('i').className = 'fa-solid fa-volume-high text-lg';
                volumeLevel.style.width = `${volume}%`;
            }
        };
        
        const handleVolumeClick = (e) => {
            const rect = volumeContainer.getBoundingClientRect();
            
            // Sempre horizontal
            const clickX = e.clientX - rect.left;
            const newVolume = (clickX / rect.width) * 100;
            setVolume(newVolume);
        };
        
        volumeBtn.addEventListener('click', toggleMute);
        volumeContainer.addEventListener('click', handleVolumeClick);
        
        setVolume(volume);
    };
    
    const setupRepeatControl = () => {
        const toggleRepeat = () => {
            // Se shuffle estiver ativo, desativa primeiro
            if (isShuffling) {
                disableShuffle();
            }
            
            isRepeating = !isRepeating;
            const icon = repeatBtn.querySelector('i');
            audioElement.loop = isRepeating;
            
            if (isRepeating) {
                icon.classList.remove('text-gray-400');
                icon.classList.add('text-green-500');
                console.log('Modo repeat ativado');
            } else {
                icon.classList.remove('text-green-500');
                icon.classList.add('text-gray-400');
                console.log('Modo repeat desativado');
            }
        };
        
        repeatBtn.addEventListener('click', toggleRepeat);
    };

    const setupShuffleControl = () => {
        const toggleShuffle = () => {
            // Se repeat estiver ativo, desativa primeiro
            if (isRepeating) {
                disableRepeat();
            }
            
            isShuffling = !isShuffling;
            const icon = shuffleBtn.querySelector('i');
            
            if (isShuffling) {
                // Salva a ordem original e embaralha
                originalEpisodeOrder = [...episodesData];
                shuffleEpisodes();
                icon.classList.remove('text-gray-400');
                icon.classList.add('text-green-500');
                shuffleBtn.title = 'Desativar reprodução aleatória';
                console.log('Modo shuffle ativado');
            } else {
                // Restaura a ordem original
                restoreOriginalOrder();
                icon.classList.remove('text-green-500');
                icon.classList.add('text-gray-400');
                shuffleBtn.title = 'Ativar reprodução aleatória';
                console.log('Modo shuffle desativado');
            }
        };
        
        shuffleBtn.addEventListener('click', toggleShuffle);
    };
    
    const closePlayer = () => {
        pause();
        player.classList.add('hidden');
        updatePlayButton();
    };
    
    const updatePlayerInfo = (episodeData) => {
        currentTrack.textContent = episodeData.nome;
        currentPodcast.textContent = episodeData.autor || 'Podcast Gramsci';
        // Atualiza a imagem com ajuste perfeito e centralização
        currentEpisodeImage.style.backgroundImage = `url('${episodeData.imageUrl}')`;
        currentEpisodeImage.className = `w-10 h-10 rounded-full bg-cover bg-center object-cover`;
        // Garante que a imagem preencha perfeitamente o círculo
        currentEpisodeImage.style.backgroundSize = 'cover';
        currentEpisodeImage.style.backgroundPosition = 'center center';
        currentEpisodeImage.style.backgroundRepeat = 'no-repeat';
    };
    
    const loadEpisode = (episodeData) => {
      
            if (isPlaying) {
                pause();
            }
            
            console.log(`Carregando: ${episodeData.nome}`);
            audioElement.src = episodeData.audio;
            
            updatePlayerInfo(episodeData);
            
            currentEpisode = episodeData.id;
            currentEpisodeIndex = episodesData.findIndex(ep => ep.id === episodeData.id);
            player.classList.remove('hidden');
            
            audioElement.addEventListener('loadedmetadata', setDuration, { once: true });
            
         };
    
    const play = async () => {
        try {
            if (!audioElement.src) return;        
            await audioElement.play();
            isPlaying = true;
            updatePlayButton();
            progressInterval = setInterval(updateProgress, 1000);
            
        } catch (error) {
            console.error('Erro ao reproduzir:', error);
            isPlaying = true;
            updatePlayButton();
            progressInterval = setInterval(updateProgress, 1000);
        }
    };
    
    const pause = () => {
        try {
            audioElement.pause();
        } catch (error) {
            console.error('Erro ao pausar:', error);
        }
        isPlaying = false;
        updatePlayButton();
        clearInterval(progressInterval);
    };
    
    const updatePlayButton = () => {
        const icon = isPlaying ? 'fa-pause' : 'fa-play';
        playerPlayBtn.innerHTML = `<i class="fa-solid ${icon} text-lg"></i>`;
    };
    
    const togglePlayPause = () => {
        isPlaying ? pause() : play();
    };
    
    const init = () => {
        playerPlayBtn.addEventListener('click', togglePlayPause);
        closePlayerBtn.addEventListener('click', closePlayer);
        
        // CORREÇÃO: backward-btn vai para música ANTERIOR
        backwardBtn.addEventListener('click', playPreviousEpisode);
        
        // CORREÇÃO: forward-btn vai para PRÓXIMA música
        forwardBtn.addEventListener('click', playNextEpisode);
        
        setupProgressBar();
        setupVolumeControls();
        setupRepeatControl();
        setupShuffleControl();
        
        audioElement.addEventListener('timeupdate', updateProgress);
        
        audioElement.addEventListener('ended', () => {
            console.log('Episódio terminado, iniciando próximo...');
            playNextEpisode();
        });
    };

    return { 
        init, 
        loadEpisode, 
        play, 
        pause, 
        togglePlayPause,
        playNextEpisode,
        playPreviousEpisode
    };
})();

window.episodeManager = {
    playEpisode: function(episodeData) {
        audioManager.loadEpisode(episodeData);
        audioManager.play();
        
        this.updateActiveEpisode(episodeData.id);
    },
    
    updateActiveEpisode: function(episodeId) {
        const episodeElements = document.querySelectorAll('.episode');
        episodeElements.forEach(ep => {
            ep.classList.remove('episode-playing');
            if (ep.dataset.episodeId == episodeId) {
                ep.classList.add('episode-playing');
            }
        });
    },
    
    setupEpisodeListeners: function() {
        const episodeElements = document.querySelectorAll('.episode');
        episodeElements.forEach(episode => {
            episode.addEventListener('click', () => {
                const episodeId = episode.dataset.episodeId;
                const episodeData = episodesData.find(ep => ep.id == episodeId);
                if (episodeData) {
                    this.playEpisode(episodeData);
                }
            });
        });
    }
};

function initializeSearchSystem() {
    const searchInput = document.getElementById('search-audio');
    const episodesContainer = document.getElementById('episodes-container');
    let originalEpisodesHTML = '';
    let isSearching = false;
    let currentSearchTerm = '';
    
    setTimeout(() => {
        originalEpisodesHTML = episodesContainer.innerHTML;
    }, 1000);
    
    function renderFilteredEpisodes(filteredEpisodes) {
        episodesContainer.innerHTML = '';
        
        if (filteredEpisodes.length === 0) {
            const noResultsMessage = document.createElement('div');
            noResultsMessage.className = 'no-results-message text-center text-gray-400 py-8 col-span-full';
            noResultsMessage.textContent = 'Nenhum episódio encontrado';
            episodesContainer.appendChild(noResultsMessage);
            return;
        }
        
        const orderedFilteredEpisodes = filteredEpisodes.sort((a, b) => a.id - b.id);
        
        orderedFilteredEpisodes.forEach(episode => {
            const episodeElement = createEpisodeElement(episode);
            episodesContainer.appendChild(episodeElement);
        });
        
        setTimeout(() => {
            if (window.episodeManager && window.episodeManager.setupEpisodeListeners) {
                window.episodeManager.setupEpisodeListeners();
            }
        }, 100);
    }

    function createEpisodeElement(episode) {
        const episodeDiv = document.createElement('div');
        episodeDiv.className = `episode flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors episode-transition ${episode.bannerGradient ? 'active-banner' : ''}`;
        episodeDiv.dataset.episodeId = episode.id;
        
        episodeDiv.innerHTML = `
            <!-- Conteúdo Principal -->
            <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <!-- Ícone do Episódio -->
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cover bg-center"
                         style="background-image: url('${episode.imageUrl}'); background-size: cover; background-position: center center; background-repeat: no-repeat;">
                    </div>
                </div>
                
                <!-- Informações do Episódio -->
                <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-red-500 text-sm sm:text-base mb-1 break-words leading-tight line-clamp-2">
                        ${episode.nome}
                    </h3>
                    <p class="text-gray-400 text-xs sm:text-sm mb-2 break-words leading-relaxed line-clamp-2">
                        ${episode.descricao}
                    </p>
                    
                    <!-- Metadados - Mobile em coluna, Desktop em linha -->
                    <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                        <span class="flex items-center gap-1">
                            <i class="fa-regular fa-calendar text-xs"></i>
                            ${episode.data}
                        </span>
                        <span class="flex items-center gap-1">
                            <i class="fa-regular fa-clock text-xs"></i>
                            ${formatTime(episode.audioDuration || episode.defaultDuration)}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Blockchain Info - Mobile abaixo, Desktop à direita -->
            <div class="sm:text-right min-w-0 mt-2 sm:mt-0 sm:flex-shrink-0 sm:w-48">
                <div class="flex flex-col gap-1 text-xs">
                    <!-- Hash Blockchain -->
                    <div class="flex sm:flex-col items-start sm:items-end gap-1">
                        <span class="text-green-500 font-mono break-all line-clamp-1 sm:text-right">
                            ${episode.blockchainHash ? episode.blockchainHash.substring(0, 12) + '...' : 'Carregando...'}
                        </span>
                    </div>
                    
                    <!-- Info Adicional Blockchain -->
                    <div class="flex sm:justify-end items-center gap-3 text-gray-500 text-xs">
                        <span class="flex items-center gap-1">
                            <i class="fa-solid fa-cube text-xs"></i>
                            Bloco ${episode.blockIndex}
                        </span>
                        <span class="flex items-center gap-1">
                            <i class="fa-regular fa-calendar text-xs"></i>
                            ${episode.blockchainDate}
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        return episodeDiv;
    }

    function filterEpisodes(searchTerm) {
        const filteredEpisodes = episodesData.filter(episode => {
            const episodeTitle = episode.nome.toLowerCase();
            const episodeDescription = episode.descricao.toLowerCase();
            const episodeAuthor = episode.autor.toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            
            return episodeTitle.includes(searchLower) || 
                   episodeDescription.includes(searchLower) ||
                   episodeAuthor.includes(searchLower);
        });
        
        renderFilteredEpisodes(filteredEpisodes);
    }
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.trim();
        currentSearchTerm = searchTerm;
        
        if (searchTerm.length > 0) {
            isSearching = true;
            filterEpisodes(searchTerm);
        } else {
            isSearching = false;
            episodesContainer.innerHTML = originalEpisodesHTML;
            
            setTimeout(() => {
                if (window.episodeManager && window.episodeManager.setupEpisodeListeners) {
                    window.episodeManager.setupEpisodeListeners();
                }
            }, 100);
        }
    });
    
    searchInput.addEventListener('search', function() {
        if (this.value === '') {
            isSearching = false;
            episodesContainer.innerHTML = originalEpisodesHTML;
            setTimeout(() => {
                if (window.episodeManager && window.episodeManager.setupEpisodeListeners) {
                    window.episodeManager.setupEpisodeListeners();
                }
            }, 100);
        }
    });
    
    function reapplySearchIfNeeded() {
        if (isSearching && currentSearchTerm.length > 0) {
            console.log('Reaplicando pesquisa após atualização...');
            filterEpisodes(currentSearchTerm);
        }
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    return {
        reapplySearchIfNeeded,
        isSearching: () => isSearching
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando aplicação de áudio');

    window.audioManager = audioManager;
    window.episodesData = episodesData;
    
    audioManager.init();
    initializeSearchSystem();
    
    try {
        
        await initializeBlockchainWithMusics();
        console.log('Sistema de áudio carregado com sucesso!');
        console.log('Navegação entre músicas configurada:');
        console.log('⏮️ Backward: Música anterior');
        console.log('⏭️ Forward: Próxima música');
        console.log('Reprodução automática em sequência ativada');
    } catch (error) {
        console.error('Erro fatal:', error);
    }
});