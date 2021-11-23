// List of elements cached, so each selector is called just once
let cards = [], cardsFronts = [], cardsBacks = [], cardsShadows = [], cardsTexts = [], cardsOverlays = [], origin;
const cardDimensions = {x: 0, y: 0};

const CLOSED     =  'This is',
    OPEN         =  'the best',
    OPENING      =  'solution',
    CLOSING      =  'of the task',
    TO_BE_CLOSED =  'hire me :)';

const states = [,,,,,].fill(CLOSED);  // Holds the actual state of each card


/***  Global functions  ***/

get = (id) => {
    return document.getElementById(id);
}

rndSign = () => {
    return Math.random() < .5 ? -1 : 1;
}

updateCardDimensions = () => {
    cardDimensions.x = cards[0].scrollWidth;
    cardDimensions.y = cards[0].scrollHeight;
}

/* Extend HTMLElement class to simplify DOM manipulation syntax */
HTMLElement.prototype.addClass = function(...classes) {
    this.classList.add(...classes);
};
HTMLElement.prototype.removeClass = function(...classes) {
    this.classList.remove(...classes);
};

deviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) ||
        /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)
    ) {
        return "mobile";
    }
    else {
        return "desktop";
    }
};


/***  Cards flipping functions  ***/

function openCard() {
    let i = event.target.id.split('_')[1];
    if (states[i] !== CLOSED) {
        return;
    }

    states[i] = OPENING;

    /* Set initial transformations before rotation */
    cardsBacks[i].removeClass('rotateBackSide', 'setRotated180', 'rotateBackToFront');
    cardsFronts[i].removeClass('rotateFrontSide', 'setRotated360', 'rotateFrontToBack');
    cardsShadows[i].removeClass('rotateShadow', 'rotateShadowFront', 'setRotated180');

    /* Rotate */
    cardsBacks[i].addClass('rotateBackSide');
    cardsFronts[i].addClass('rotateFrontSide');
    cardsShadows[i].addClass('rotateShadow');

    for (let ii = 0; ii < 5; ++ii) {
        if (ii != i) {
            if (states[ii] === OPEN) {
                closeCard(ii);
            }
            else if (states[ii] === OPENING) {
                states[ii] = TO_BE_CLOSED;
            }
        }
    }
}

function closeCard(closeCardId) {
    let i = closeCardId === undefined ? event.target.id.split('_')[1] : closeCardId;

    if (states[i] !== OPEN) {
        return;
    }

    states[i] = CLOSING;

    /* Set initial transformations before rotation */
    cardsFronts[i].addClass('setRotated360', 'rotateFrontToBack');
    cardsShadows[i].addClass('setRotated180');

    /* Rotate */
    cardsBacks[i].addClass('setRotated180', 'rotateBackToFront');
    cardsShadows[i].addClass('rotateShadowFront');
}

dealCards = () => {
    // Assign animation class to each card
    for (let i = 0; i < cards.length; ++i) {
        cards[i].addClass(`deal${4 - i}`);
    }
}


/***  Generate cards  ***/

origin = get('origin');
const angleSegment = 2 * Math.PI / 5;
const radius = window.innerWidth / 80;
for (let i = 0; i < 5; ++i) {
    const cardHTML =
        `<div class="card" id="card_${i}">` +
        `    <div class="cardBack" id="cardBack_${i}" style="z-index: ${3 * i + 1}"></div>` +
        `    <div class="cardFront" id="cardFront_${i}" style="z-index: ${3 * i + 1}">` +
        `        <div class="cardOverlayBottom" id="cardOverlay_${i}" style="z-index: ${3 * i + 2}"></div>` +
        `        <div class="cardText" id="cardText_${i}">` +
        `           <h1>${cardsTitles[4 - i]}</h1>` +
        `           ${cardsContents[4 - i]}` +
        `       </div>` +
        `    </div>` +
        `    <div class="cardShadow" id="cardShadow_${i}" style="z-index: ${3 * i}"></div>` +
        `</div>`;

    const newCard = document.createElement('template');
    newCard.innerHTML = cardHTML;
    origin.appendChild(newCard.content.firstChild);

    /* Cache card elements */
    cards.push(get(`card_${i}`));
    cardsFronts.push(get(`cardFront_${i}`));
    cardsBacks.push(get(`cardBack_${i}`));
    cardsShadows.push(get(`cardShadow_${i}`));
    cardsTexts.push(get(`cardText_${i}`));
    cardsOverlays.push(get(`cardOverlay_${i}`));

    if (i === 0) {
        updateCardDimensions();
    }

    // Cards are distributed evenly in circular manner with some randomness added
    // It's universal solution for n cards and ensures every card is partially visible
    const newCardEl = cards[i];
    const angle = angleSegment * i;
    const x = Math.cos(angle) * radius - cardDimensions.x / 2 + rndSign() * 4 * Math.random();
    const y = Math.sin(angle) * radius - cardDimensions.y / 2 + rndSign() * 4 * Math.random();

    newCardEl.style.left = x + 'px';
    newCardEl.style.top = y + 'px';

    /* Set listener for initial cards dealing */
    newCardEl.addEventListener('click', dealCards);

    /* Listeners that need to be set after cards dealing */
    newCardEl.addEventListener('webkitAnimationEnd', () => {

        /* Set scrolling event listeners */
        setScrollingListeners(i);

        /* Set flip card event listeners */
        cardsBacks[i].addEventListener(`click`, openCard);

        cardsBacks[i].addEventListener('webkitAnimationEnd', () => {
            if (states[i] === TO_BE_CLOSED) {
                states[i] = OPEN;
                cardsFronts[i].click();
            }
            else if (states[i] === OPENING) {
                states[i] = OPEN;
            }
            else if (states[i] === CLOSING) {
                states[i] = CLOSED;
            }
        });
    }, {once: true});
}


/***  Cards scrolling  ***/

    // TODO: Show gradient only when it's possible to scroll
    // TODO: Kinetic scrolling

let clicked = false;
let scrolling = false;
let lastY;

if (deviceType() === 'desktop') {
    document.getElementsByTagName('body')[0].addEventListener('mouseup', mouseUpListener);
}
else {
    document.getElementsByTagName('body')[0].addEventListener('touchend', mouseUpListener);
    document.getElementsByTagName('body')[0].addEventListener('touchcancel', mouseUpListener);
}

function setScrollingListeners(i) {
    const cardOverlay = cardsOverlays[i];
    const cardText = cardsTexts[i];

    if (deviceType() === 'desktop') {
        cardOverlay.addEventListener('mousedown', mouseDownListener);
    }
    else {
        cardOverlay.addEventListener('touchstart', mouseDownListener);
    }

    if (deviceType() === 'desktop') {
        cardOverlay.addEventListener('mousemove', () => {
            pointerMoveListener(cardText, cardOverlay, event.clientY);
        });
    }
    else {
        cardOverlay.addEventListener('touchmove', () => {
            pointerMoveListener(cardText, cardOverlay, event.touches[0].clientY);
        });
    }

    // This solves a situation, when a user tries to drag a card to a side
    // (I.e. moves the mouse just horizontally and the browser starts element dragging)
    cardOverlay.addEventListener('drag', () => clicked = false);
}


function mouseUpListener() {
    if (event.button === 2 || event.button === 1) {  // Ignore MMB & RMB click
        return;
    }

    if (!scrolling) {
        closeCard();
    }

    clicked = false;
    scrolling = false;
}

function mouseDownListener() {
    if (event.button === 2 || event.button === 1) {
        return;
    }

    lastY = event.clientY;
    clicked = true;
    scrolling = false;
}

function pointerMoveListener(cardText, cardOverlay, cursorY) {
    if (!clicked) return;
    if (!scrolling) {
        scrolling = true;
    }

    /* Scroll */
    let delta = lastY - cursorY;
    lastY = cursorY;
    cardText.scrollBy(0, delta);

    /* Manages overlay gradients */
    if (cardText.scrollTop === 0) {
        // Show just bottom gradient when scrolled to top
        cardOverlay.removeClass('cardOverlayTopAndBottom', 'cardOverlayTop');
        cardOverlay.addClass('cardOverlayBottom');
    }
    else if (cardText.scrollHeight - cardText.scrollTop - cardText.offsetHeight === 0) {
        // Show just top gradient when scrolled to bottom
        cardOverlay.removeClass('cardOverlayTopAndBottom', 'cardOverlayBottom');
        cardOverlay.addClass('cardOverlayTop');
    }
    else {
        // Show both top & bottom gradients when scrolled somewhere between
        cardOverlay.removeClass('cardOverlayTop', 'cardOverlayBottom');
        cardOverlay.addClass('cardOverlayTopAndBottom');
    }
}
