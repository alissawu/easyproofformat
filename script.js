// Core replacements (always active)
const replacements = {
    // Multi-character replacements (must come first)
    '<->': '↔',
    '<=>': '↔',  // Same as <->
    '->': '→',
    '=>': '→',    // Same as ->
    '<-': '←',
    '<=': '←',    // Same as <-
    '!=': '≠',
    
    // Single character replacements
    'n': '∩',
    'u': '∪',
    'v': '∨',
    '^': '∧'
};

// Instant replacements (no space needed)
const instantReplacements = {
    '!': '¬',
    '~': '¬'
};

// LaTeX conversion map
const latexMap = {
    '∩': '\\cap',
    '∪': '\\cup',
    '∨': '\\lor',
    '∧': '\\land',
    '¬': '\\neg',
    '→': '\\rightarrow',
    '←': '\\leftarrow',
    '↔': '\\leftrightarrow',
    '≠': '\\neq',
    '≡': '\\equiv',
    '⊤': '\\top',
    '⊥': '\\bot',
    '⊕': '\\oplus',
    '∴': '\\therefore',
    '∀': '\\forall',
    '∃': '\\thereexists',
    '∈': '\\in',
    '∅': '\\emptyset'
};

// Global variables
let lineCount = 1;
let allLines = [1];

// Optional shortcuts that can be toggled
const optionalShortcuts = {
    'forall': '∀',
    'thereexists': '∃',
    'in': '∈',
    'empty': '∅',
    'equiv': '≡',
    'xor': '⊕',
    'therefore': '∴',
    'T': '⊤',
    'F': '⊥'
};

// Track which optional shortcuts are active
let activeOptional = new Set();

// Custom user-defined shortcuts
let customShortcuts = {};

// Load saved shortcuts from localStorage
function loadSavedShortcuts() {
    try {
        const saved = localStorage.getItem('customShortcuts');
        if (saved) {
            customShortcuts = JSON.parse(saved);
        }
        const savedActive = localStorage.getItem('activeOptional');
        if (savedActive) {
            activeOptional = new Set(JSON.parse(savedActive));
        }
    } catch(e) {
        console.log('Could not load saved shortcuts');
    }
    renderOptionalShortcuts();
}

function renderOptionalShortcuts() {
    const container = document.getElementById('optionalShortcuts');
    if (!container) return;
    container.innerHTML = '';
    
    // Add optional shortcuts
    Object.entries(optionalShortcuts).forEach(([from, to]) => {
        const btn = document.createElement('button');
        btn.style.cssText = 'padding: 2px 4px; font-size: 11px; background: white; border: 1px solid #999; cursor: pointer;';
        if (activeOptional.has(from)) {
            btn.style.background = '#ddd';
            btn.style.fontWeight = 'bold';
        }
        btn.textContent = `${from}→${to}`;
        btn.onclick = () => toggleOptional(from);
        container.appendChild(btn);
    });
    
    // Add custom shortcuts
    Object.entries(customShortcuts).forEach(([from, to]) => {
        const btn = document.createElement('button');
        btn.style.cssText = 'padding: 2px 4px; font-size: 11px; background: #e6f2ff; border: 1px solid #0066cc; cursor: pointer;';
        btn.textContent = `${from}→${to}`;
        btn.onclick = () => removeCustomShortcut(from);
        btn.title = 'Click to remove';
        container.appendChild(btn);
    });
}

function toggleOptional(key) {
    if (activeOptional.has(key)) {
        activeOptional.delete(key);
    } else {
        activeOptional.add(key);
    }
    try {
        localStorage.setItem('activeOptional', JSON.stringify([...activeOptional]));
    } catch(e) {
        console.log('Could not save optional shortcuts');
    }
    renderOptionalShortcuts();
}

function addCustomShortcut() {
    const from = document.getElementById('customFrom').value;
    const to = document.getElementById('customTo').value;
    if (from && to) {
        customShortcuts[from] = to;
        try {
            localStorage.setItem('customShortcuts', JSON.stringify(customShortcuts));
        } catch(e) {
            console.log('Could not save custom shortcuts');
        }
        document.getElementById('customFrom').value = '';
        document.getElementById('customTo').value = '';
        renderOptionalShortcuts();
    }
}

function removeCustomShortcut(key) {
    delete customShortcuts[key];
    try {
        localStorage.setItem('customShortcuts', JSON.stringify(customShortcuts));
    } catch(e) {
        console.log('Could not save shortcuts');
    }
    renderOptionalShortcuts();
}

// Get all active replacements
function getAllReplacements() {
    let all = {...replacements};
    activeOptional.forEach(key => {
        all[key] = optionalShortcuts[key];
    });
    return {...all, ...customShortcuts};
}

// Line management functions
function addLine() {
    lineCount++;
    allLines.push(lineCount);
    const container = document.getElementById('proofLines');
    const newLine = document.createElement('div');
    newLine.className = 'proof-line';
    newLine.setAttribute('data-line-id', lineCount);
    newLine.innerHTML = `
        <div class="line-number">${allLines.indexOf(lineCount) + 1}.</div>
        <input type="text" class="proof-input" placeholder="expression">
        <input type="text" class="reason-input" placeholder="reason">
        <div class="line-actions">
            <button class="line-btn" onclick="clearLine(${lineCount})">clr</button>
            <button class="line-btn" onclick="deleteLine(${lineCount})">del</button>
        </div>
    `;
    container.appendChild(newLine);
    
    // Add event listeners to the new inputs
    const proofInput = newLine.querySelector('.proof-input');
    const reasonInput = newLine.querySelector('.reason-input');
    
    proofInput.addEventListener('input', handleInput);
    proofInput.addEventListener('input', updatePreview);
    proofInput.addEventListener('keydown', handleEnterKey);
    
    reasonInput.addEventListener('input', updatePreview);
    reasonInput.addEventListener('keydown', handleEnterKey);
    
    // Focus on the new proof input
    proofInput.focus();
}

function clearLine(lineId) {
    const line = document.querySelector(`[data-line-id="${lineId}"]`);
    if (line) {
        line.querySelector('.proof-input').value = '';
        line.querySelector('.reason-input').value = '';
        updatePreview();
    }
}

function deleteLine(lineId) {
    const line = document.querySelector(`[data-line-id="${lineId}"]`);
    if (line && allLines.length > 1) {
        allLines = allLines.filter(id => id !== lineId);
        line.remove();
        renumberLines();
        updatePreview();
    }
}

function clearAllLines() {
    const container = document.getElementById('proofLines');
    container.innerHTML = '';
    lineCount = 0;
    allLines = [];
    addLine();
    updatePreview();
}

function renumberLines() {
    const lines = document.querySelectorAll('.proof-line');
    lines.forEach((line, index) => {
        line.querySelector('.line-number').textContent = `${index + 1}.`;
    });
}

function insertLineAfter(currentLine) {
    lineCount++;
    const currentLineId = parseInt(currentLine.getAttribute('data-line-id'));
    const currentLineIndex = allLines.indexOf(currentLineId);
    allLines.splice(currentLineIndex + 1, 0, lineCount);
    
    const newLine = document.createElement('div');
    newLine.className = 'proof-line';
    newLine.setAttribute('data-line-id', lineCount);
    newLine.innerHTML = `
        <div class="line-number">${currentLineIndex + 2}.</div>
        <input type="text" class="proof-input" placeholder="expression">
        <input type="text" class="reason-input" placeholder="reason">
        <div class="line-actions">
            <button class="line-btn" onclick="clearLine(${lineCount})">clr</button>
            <button class="line-btn" onclick="deleteLine(${lineCount})">del</button>
        </div>
    `;
    
    // Insert after current line
    currentLine.insertAdjacentElement('afterend', newLine);
    
    // Renumber all lines
    renumberLines();
    
    // Add event listeners to the new inputs
    const proofInput = newLine.querySelector('.proof-input');
    const reasonInput = newLine.querySelector('.reason-input');
    
    proofInput.addEventListener('input', handleInput);
    proofInput.addEventListener('input', updatePreview);
    proofInput.addEventListener('keydown', handleEnterKey);
    
    reasonInput.addEventListener('input', updatePreview);
    reasonInput.addEventListener('keydown', handleEnterKey);
    
    // Focus on the new proof input
    proofInput.focus();
}

// Input handling functions
function handleEnterKey(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        
        const currentInput = e.target;
        const currentLine = currentInput.closest('.proof-line');
        const allInputs = Array.from(document.querySelectorAll('.proof-input, .reason-input'));
        const currentIndex = allInputs.indexOf(currentInput);
        
        // Check if Shift is held - if so, insert line after current
        if (e.shiftKey) {
            insertLineAfter(currentLine);
        } else {
            // Normal Enter behavior - move to next field
            if (currentIndex === allInputs.length - 1) {
                addLine();
            } else {
                allInputs[currentIndex + 1].focus();
            }
        }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        handleArrowKeys(e);
    }
}

function handleArrowKeys(e) {
    const currentInput = e.target;
    const isProofInput = currentInput.classList.contains('proof-input');
    const currentLine = currentInput.closest('.proof-line');
    const allLines = Array.from(document.querySelectorAll('.proof-line'));
    const currentLineIndex = allLines.indexOf(currentLine);
    
    if (e.key === 'ArrowUp') {
        // Move to same type input in line above
        if (currentLineIndex > 0) {
            e.preventDefault();
            const targetLine = allLines[currentLineIndex - 1];
            const targetInput = isProofInput ? 
                targetLine.querySelector('.proof-input') : 
                targetLine.querySelector('.reason-input');
            if (targetInput) targetInput.focus();
        }
    } else if (e.key === 'ArrowDown') {
        // Move to same type input in line below
        if (currentLineIndex < allLines.length - 1) {
            e.preventDefault();
            const targetLine = allLines[currentLineIndex + 1];
            const targetInput = isProofInput ? 
                targetLine.querySelector('.proof-input') : 
                targetLine.querySelector('.reason-input');
            if (targetInput) targetInput.focus();
        }
    } else if (e.key === 'ArrowRight' && currentInput.selectionStart === currentInput.value.length) {
        // Move to next input if at end of current input
        e.preventDefault();
        if (isProofInput) {
            const reasonInput = currentLine.querySelector('.reason-input');
            if (reasonInput) reasonInput.focus();
        } else if (currentLineIndex < allLines.length - 1) {
            // Move to next line's proof input
            const nextLine = allLines[currentLineIndex + 1];
            const nextProof = nextLine.querySelector('.proof-input');
            if (nextProof) nextProof.focus();
        }
    } else if (e.key === 'ArrowLeft' && currentInput.selectionStart === 0) {
        // Move to previous input if at start of current input
        e.preventDefault();
        if (!isProofInput) {
            const proofInput = currentLine.querySelector('.proof-input');
            if (proofInput) {
                proofInput.focus();
                proofInput.setSelectionRange(proofInput.value.length, proofInput.value.length);
            }
        } else if (currentLineIndex > 0) {
            // Move to previous line's reason input
            const prevLine = allLines[currentLineIndex - 1];
            const prevReason = prevLine.querySelector('.reason-input');
            if (prevReason) {
                prevReason.focus();
                prevReason.setSelectionRange(prevReason.value.length, prevReason.value.length);
            }
        }
    }
}

function handleInput(e) {
    const input = e.target;
    const start = input.selectionStart;
    let value = input.value;
    let newCursorPos = start;
    
    // Apply replacements to proof inputs and text areas (not reason inputs)
    if (input.classList.contains('proof-input') || input.classList.contains('text-area')) {
        // First check for instant replacements (!, ~, ^)
        const justTyped = value[start - 1];
        if (instantReplacements[justTyped]) {
            value = value.substring(0, start - 1) + 
                    instantReplacements[justTyped] + 
                    value.substring(start);
            newCursorPos = start;
        }
        // Check if space was just typed for other replacements
        else if (justTyped === ' ') {
            // Get everything before the space
            const beforeSpace = value.substring(0, start - 1);
            
            // Get all active replacements including optional and custom
            const allReplacements = getAllReplacements();
            const sortedReplacements = Object.entries(allReplacements).sort((a, b) => b[0].length - a[0].length);
            
            for (const [key, symbol] of sortedReplacements) {
                // Check if the key appears right before the space
                if (beforeSpace.endsWith(key)) {
                    const keyStart = beforeSpace.length - key.length;
                    
                    // For n, u, v, ^ - require space before (or start of string)
                    if (key === 'n' || key === 'u' || key === 'v' || key === '^') {
                        if (keyStart === 0 || beforeSpace[keyStart - 1] === ' ') {
                            value = value.substring(0, keyStart) + 
                                    symbol + 
                                    value.substring(keyStart + key.length);
                            newCursorPos = keyStart + symbol.length + 1;
                            break;
                        }
                    } else {
                        // All other replacements work as before (no space required before)
                        value = value.substring(0, keyStart) + 
                                symbol + 
                                value.substring(keyStart + key.length);
                        newCursorPos = keyStart + symbol.length + 1;
                        break;
                    }
                }
            }
        }
    }
    
    input.value = value;
    input.setSelectionRange(newCursorPos, newCursorPos);
}

// Preview and export functions
function updatePreview() {
    const preview = document.getElementById('preview');
    const preText = document.getElementById('preText').value;
    const postText = document.getElementById('postText').value;
    const lines = document.querySelectorAll('.proof-line');
    let html = '';
    
    // Add pre-text if exists
    if (preText) {
        html += `<div class="preview-text">Given:\n${preText}</div>`;
    }
    
    // Add proof lines
    let hasProofLines = false;
    lines.forEach((line, index) => {
        const expr = line.querySelector('.proof-input').value;
        const reason = line.querySelector('.reason-input').value;
        
        if (expr) {
            if (!hasProofLines) {
                html += '<div style="margin: 10px 0;">Proof:</div>';
                hasProofLines = true;
            }
            html += `<div class="preview-line">
                <div class="preview-expr">${index + 1}. ${expr}</div>
                ${reason ? `<div class="preview-reason">[${reason}]</div>` : ''}
            </div>`;
        }
    });
    
    // Add post-text if exists
    if (postText) {
        html += `<div class="preview-text">Therefore:\n${postText}</div>`;
    }
    
    preview.innerHTML = html || '';
}

function convertToLatex(text) {
    let latex = text;
    for (const [symbol, latexCmd] of Object.entries(latexMap)) {
        latex = latex.replace(new RegExp(escapeRegex(symbol), 'g'), latexCmd + ' ');
    }
    return latex;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function copyAsLatex() {
    const preText = document.getElementById('preText').value;
    const postText = document.getElementById('postText').value;
    const lines = document.querySelectorAll('.proof-line');
    let latex = '';
    
    // Add pre-text if exists
    if (preText) {
        latex += '\\textbf{Given:}\\\\\n' + preText.replace(/\n/g, '\\\\\n') + '\\\\\n\n';
    }
    
    // Add proof section
    latex += '\\textbf{Proof:}\\\\\n';
    latex += '\\begin{align}\n';
    
    lines.forEach((line, index) => {
        const expr = line.querySelector('.proof-input').value;
        const reason = line.querySelector('.reason-input').value;
        
        if (expr) {
            const latexExpr = convertToLatex(expr);
            latex += `  &${latexExpr}`;
            if (reason) {
                latex += ` && \\text{[${reason}]}`;
            }
            if (index < lines.length - 1) {
                latex += ' \\\\';
            }
            latex += '\n';
        }
    });
    
    latex += '\\end{align}\n';
    
    // Add post-text if exists
    if (postText) {
        latex += '\n\\textbf{Therefore:}\\\\\n' + postText.replace(/\n/g, '\\\\\n');
    }
    
    // Show LaTeX output
    const latexOutput = document.getElementById('latexOutput');
    latexOutput.textContent = latex;
    latexOutput.style.display = 'block';
    
    // Copy to clipboard
    navigator.clipboard.writeText(latex).then(() => {
        showCopyStatus();
    });
}

function copyAsText() {
    const preText = document.getElementById('preText').value;
    const postText = document.getElementById('postText').value;
    const lines = document.querySelectorAll('.proof-line');
    let text = '';
    
    // Add pre-text if exists
    if (preText) {
        text += 'Given:\n' + preText + '\n\n';
    }
    
    // Calculate max length for tab alignment
    let maxLength = 0;
    lines.forEach((line, index) => {
        const expr = line.querySelector('.proof-input').value;
        if (expr) {
            const lineStart = `${index + 1}. ${expr}`;
            maxLength = Math.max(maxLength, lineStart.length);
        }
    });
    
    // Calculate tab width (assuming 8 chars per tab)
    const tabWidth = 8;
    const targetColumn = Math.ceil((maxLength + 4) / tabWidth) * tabWidth;
    
    // Add proof lines using calculated tabs
    text += 'Proof:\n';
    lines.forEach((line, index) => {
        const expr = line.querySelector('.proof-input').value;
        const reason = line.querySelector('.reason-input').value;
        
        if (expr) {
            const lineStart = `${index + 1}. ${expr}`;
            text += lineStart;
            if (reason) {
                // Calculate how many tabs needed to reach target column
                const currentLength = lineStart.length;
                const tabsNeeded = Math.ceil((targetColumn - currentLength) / tabWidth);
                text += '\t'.repeat(Math.max(1, tabsNeeded)) + `[${reason}]`;
            }
            text += '\n';
        }
    });
    
    // Add post-text if exists
    if (postText) {
        text += '\nTherefore:\n' + postText;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showCopyStatus();
    });
}

function showCopyStatus() {
    const status = document.getElementById('copyStatus');
    status.classList.add('show');
    setTimeout(() => {
        status.classList.remove('show');
    }, 2000);
}

// Set theory replacements
const setReplacements = {
    // Slash-triggered replacements (for words that might be used in regular text)
    '/in': '∈',
    '/notin': '∉',
    '/subset': '⊆',
    '/psubset': '⊂',  // proper subset
    '/superset': '⊇',
    '/psuperset': '⊃',  // proper superset
    '/empty': '∅',
    '/forall': '∀',
    '/thereexists': '∃',
    '/exists': '∃',  // alternate for exists
    
    // Direct replacements (less likely to conflict)
    '\\': '∖',  // set difference
    'delta': 'Δ',
    '!=': '≠',
    '->': '→',
    '<->': '↔',
    
    // Single character replacements (require space before)
    'u': '∪',
    'n': '∩'
};

// Convert text to Unicode superscript or subscript
function convertToSuperSubScript(text, isSuperscript) {
    // Remove curly braces if present
    if (text.startsWith('{') && text.endsWith('}')) {
        text = text.slice(1, -1);
    }
    
    const superscriptMap = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
        'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
        'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
        'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
        'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
        'A': 'ᴬ', 'B': 'ᴮ', 'C': 'ᶜ', 'D': 'ᴰ', 'E': 'ᴱ',
        'G': 'ᴳ', 'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ',
        'L': 'ᴸ', 'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ',
        'R': 'ᴿ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
    };
    
    const subscriptMap = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
        'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
        'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
        'v': 'ᵥ', 'x': 'ₓ',
        '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎'
    };
    
    const map = isSuperscript ? superscriptMap : subscriptMap;
    let result = '';
    
    for (let char of text) {
        result += map[char] || char;
    }
    
    return result;
}

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Activate button
    event.target.classList.add('active');
}

// Track superscript/subscript mode
let superscriptMode = false;
let subscriptMode = false;

// Handle keyboard events for set theory
function handleSetKeydown(e) {
    // Handle Cmd/Ctrl + . for superscript toggle
    if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        superscriptMode = !superscriptMode;
        subscriptMode = false; // Turn off subscript if on
        
        // Show visual indicator
        updateModeIndicator();
        return;
    }
    
    // Handle Cmd/Ctrl + , for subscript toggle  
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        subscriptMode = !subscriptMode;
        superscriptMode = false; // Turn off superscript if on
        
        // Show visual indicator
        updateModeIndicator();
        return;
    }
    
    // Handle Escape to exit super/subscript modes
    if (e.key === 'Escape') {
        if (superscriptMode || subscriptMode) {
            e.preventDefault();
            superscriptMode = false;
            subscriptMode = false;
            updateModeIndicator();
            return;
        }
    }
    
    // Handle arrow keys - exit super/subscript mode when navigating
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (superscriptMode || subscriptMode) {
            superscriptMode = false;
            subscriptMode = false;
            updateModeIndicator();
            // Don't prevent default - let the cursor move
        }
    }
    
    // Handle Tab for indentation
    if (e.key === 'Tab') {
        e.preventDefault();
        const input = e.target;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;
        
        // Insert tab character at cursor position
        input.value = value.substring(0, start) + '\t' + value.substring(end);
        input.setSelectionRange(start + 1, start + 1);
        
        // Trigger preview update
        updateSetPreview();
    }
}

// Update mode indicator
function updateModeIndicator() {
    // Find or create mode indicator
    let indicator = document.getElementById('modeIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'modeIndicator';
        indicator.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 10px; background: #333; color: white; border-radius: 5px; font-family: monospace; display: none; z-index: 1000;';
        document.body.appendChild(indicator);
    }
    
    if (superscriptMode) {
        indicator.textContent = 'Superscript Mode (Cmd+.)';
        indicator.style.display = 'block';
    } else if (subscriptMode) {
        indicator.textContent = 'Subscript Mode (Cmd+,)';
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }
}

// Handle input for set theory
function handleSetInput(e) {
    const input = e.target;
    const start = input.selectionStart;
    let value = input.value;
    let newCursorPos = start;
    
    const justTyped = value[start - 1];
    
    // Handle superscript/subscript modes
    if (superscriptMode || subscriptMode) {
        if (justTyped && justTyped !== ' ' && justTyped.match(/[A-Za-z0-9+\-=()]/)) {
            const converted = convertToSuperSubScript(justTyped, superscriptMode);
            if (converted !== justTyped) {
                value = value.substring(0, start - 1) + converted + value.substring(start);
                newCursorPos = start - 1 + converted.length;
                
                input.value = value;
                input.setSelectionRange(newCursorPos, newCursorPos);
                updateSetPreview();
                return;
            }
        }
        // Space doesn't exit mode - needed for typing symbols like "n " → "∩"
    }
    
    // Check if space was just typed
    if (justTyped === ' ') {
        const beforeSpace = value.substring(0, start - 1);
        
        // Sort replacements by length (longest first)
        const sortedReplacements = Object.entries(setReplacements).sort((a, b) => b[0].length - a[0].length);
        
        for (const [key, symbol] of sortedReplacements) {
            if (beforeSpace.endsWith(key)) {
                const keyStart = beforeSpace.length - key.length;
                
                // For u and n, require space before or start of string or special chars
                if (key === 'u' || key === 'n') {
                    if (keyStart === 0 || 
                        beforeSpace[keyStart - 1] === ' ' || 
                        beforeSpace[keyStart - 1] === '(' ||
                        beforeSpace[keyStart - 1] === '|' ||
                        beforeSpace[keyStart - 1] === '-' ||
                        beforeSpace[keyStart - 1] === '∩' ||
                        beforeSpace[keyStart - 1] === '∪') {
                        // Apply the symbol
                        let replacedSymbol = symbol;
                        
                        // If in superscript/subscript mode, convert the symbol
                        if (superscriptMode || subscriptMode) {
                            const convertedSymbol = convertToSuperSubScript(symbol, superscriptMode);
                            if (convertedSymbol !== symbol) {
                                replacedSymbol = convertedSymbol;
                            }
                        }
                        
                        value = value.substring(0, keyStart) + 
                                replacedSymbol + 
                                value.substring(keyStart + key.length);
                        newCursorPos = keyStart + replacedSymbol.length + 1;
                        break;
                    }
                } else {
                    // Apply the symbol
                    let replacedSymbol = symbol;
                    
                    // If in superscript/subscript mode, convert the symbol
                    if (superscriptMode || subscriptMode) {
                        const convertedSymbol = convertToSuperSubScript(symbol, superscriptMode);
                        if (convertedSymbol !== symbol) {
                            replacedSymbol = convertedSymbol;
                        }
                    }
                    
                    value = value.substring(0, keyStart) + 
                            replacedSymbol + 
                            value.substring(keyStart + key.length);
                    newCursorPos = keyStart + replacedSymbol.length + 1;
                    break;
                }
            }
        }
    }
    
    input.value = value;
    input.setSelectionRange(newCursorPos, newCursorPos);
}

// Update preview for set theory
function updateSetPreview() {
    const preview = document.getElementById('setPreview');
    const preText = document.getElementById('setPreText').value;
    const proofText = document.getElementById('setProofText').value;
    const postText = document.getElementById('setPostText').value;
    
    let html = '';
    
    // Add pre-text
    if (preText) {
        html += `<div class="preview-text">Given:\n${processSetText(preText)}</div>`;
    }
    
    // Process proof text
    if (proofText) {
        html += '<div style="margin: 10px 0;">Proof:</div>';
        const lines = proofText.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                // Check if line starts with tab or spaces (for centered equations)
                if (line.match(/^[\t ]/)) {
                    html += `<div class="set-equation">${processSetText(line.trim())}</div>`;
                } else {
                    html += `<div style="margin: 5px 0;">${processSetText(line)}</div>`;
                }
            }
        });
    }
    
    // Add post-text
    if (postText) {
        html += `<div class="preview-text">Therefore:\n${processSetText(postText)}</div>`;
    }
    
    preview.innerHTML = html || '';
}

// Process set text to handle |...| notation  
function processSetText(text) {
    // Replace |...| with styled spans using proper mathematical vertical bars
    // Using U+2223 (DIVIDES) which renders as taller vertical bars in math context
    return text.replace(/\|([^|]+)\|/g, '<span class="set-inline">∣$1∣</span>');
}

// Copy set theory as LaTeX
function copySetAsLatex() {
    const preText = document.getElementById('setPreText').value;
    const proofText = document.getElementById('setProofText').value;
    const postText = document.getElementById('setPostText').value;
    
    let latex = '';
    
    // Add pre-text
    if (preText) {
        latex += '\\textbf{Given:}\\\\\n' + convertSetToLatex(preText, false) + '\\\\\n\n';
    }
    
    // Process proof
    if (proofText) {
        latex += '\\textbf{Proof:}\\\\\n';
        const lines = proofText.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                if (line.match(/^[\t ]/)) {
                    // Centered equation
                    latex += '\\[' + convertSetToLatex(line.trim(), true) + '\\]\n';
                } else {
                    // Regular text with possible inline math
                    latex += convertSetToLatex(line, false) + '\\\\\n';
                }
            } else {
                latex += '\\\\\n';
            }
        });
    }
    
    // Add post-text
    if (postText) {
        latex += '\n\\textbf{Therefore:}\\\\\n' + convertSetToLatex(postText, false);
    }
    
    // Show and copy
    const latexOutput = document.getElementById('setLatexOutput');
    latexOutput.textContent = latex;
    latexOutput.style.display = 'block';
    
    navigator.clipboard.writeText(latex).then(() => {
        showSetCopyStatus();
    });
}

// Convert Unicode superscripts and subscripts back to LaTeX
function convertUnicodeToLatex(text) {
    // Map Unicode superscripts back to LaTeX
    const superscriptToLatex = {
        '⁰': '^{0}', '¹': '^{1}', '²': '^{2}', '³': '^{3}', '⁴': '^{4}',
        '⁵': '^{5}', '⁶': '^{6}', '⁷': '^{7}', '⁸': '^{8}', '⁹': '^{9}',
        'ᵃ': '^{a}', 'ᵇ': '^{b}', 'ᶜ': '^{c}', 'ᵈ': '^{d}', 'ᵉ': '^{e}',
        'ᶠ': '^{f}', 'ᵍ': '^{g}', 'ʰ': '^{h}', 'ⁱ': '^{i}', 'ʲ': '^{j}',
        'ᵏ': '^{k}', 'ˡ': '^{l}', 'ᵐ': '^{m}', 'ⁿ': '^{n}', 'ᵒ': '^{o}',
        'ᵖ': '^{p}', 'ʳ': '^{r}', 'ˢ': '^{s}', 'ᵗ': '^{t}', 'ᵘ': '^{u}',
        'ᵛ': '^{v}', 'ʷ': '^{w}', 'ˣ': '^{x}', 'ʸ': '^{y}', 'ᶻ': '^{z}',
        'ᴬ': '^{A}', 'ᴮ': '^{B}', 'ᴰ': '^{D}', 'ᴱ': '^{E}',
        'ᴳ': '^{G}', 'ᴴ': '^{H}', 'ᴵ': '^{I}', 'ᴶ': '^{J}', 'ᴷ': '^{K}',
        'ᴸ': '^{L}', 'ᴹ': '^{M}', 'ᴺ': '^{N}', 'ᴼ': '^{O}', 'ᴾ': '^{P}',
        'ᴿ': '^{R}', 'ᵀ': '^{T}', 'ᵁ': '^{U}', 'ⱽ': '^{V}', 'ᵂ': '^{W}',
        '⁺': '^{+}', '⁻': '^{-}', '⁼': '^{=}', '⁽': '^{(}', '⁾': '^{)}'
    };
    
    // Map Unicode subscripts back to LaTeX
    const subscriptToLatex = {
        '₀': '_{0}', '₁': '_{1}', '₂': '_{2}', '₃': '_{3}', '₄': '_{4}',
        '₅': '_{5}', '₆': '_{6}', '₇': '_{7}', '₈': '_{8}', '₉': '_{9}',
        'ₐ': '_{a}', 'ₑ': '_{e}', 'ₕ': '_{h}', 'ᵢ': '_{i}', 'ⱼ': '_{j}',
        'ₖ': '_{k}', 'ₗ': '_{l}', 'ₘ': '_{m}', 'ₙ': '_{n}', 'ₒ': '_{o}',
        'ₚ': '_{p}', 'ᵣ': '_{r}', 'ₛ': '_{s}', 'ₜ': '_{t}', 'ᵤ': '_{u}',
        'ᵥ': '_{v}', 'ₓ': '_{x}',
        '₊': '_{+}', '₋': '_{-}', '₌': '_{=}', '₍': '_{(}', '₎': '_{)}'
    };
    
    let result = text;
    
    // Replace all Unicode super/subscripts with LaTeX
    for (const [unicode, latex] of Object.entries(superscriptToLatex)) {
        result = result.replace(new RegExp(unicode, 'g'), latex);
    }
    for (const [unicode, latex] of Object.entries(subscriptToLatex)) {
        result = result.replace(new RegExp(unicode, 'g'), latex);
    }
    
    return result;
}

// Convert set notation to LaTeX
function convertSetToLatex(text, isEquation) {
    // First convert Unicode superscripts/subscripts to LaTeX
    let result = convertUnicodeToLatex(text);
    
    // LaTeX symbol mappings
    const setLatexMap = {
        '∪': '\\cup',
        '∩': '\\cap',
        '∖': '\\setminus',
        '∈': '\\in',
        '∉': '\\notin',
        '⊆': '\\subseteq',
        '⊂': '\\subset',
        '⊇': '\\supseteq',
        '⊃': '\\supset',
        '∅': '\\emptyset',
        'Δ': '\\Delta',
        '≠': '\\neq',
        '→': '\\rightarrow',
        '↔': '\\leftrightarrow',
        '∀': '\\forall',
        '∃': '\\exists',
        '¬': '\\neg',
        '∧': '\\land',
        '∨': '\\lor'
    };
    
    if (isEquation) {
        // Full equation - convert all symbols
        for (const [symbol, latex] of Object.entries(setLatexMap)) {
            result = result.replace(new RegExp(escapeRegex(symbol), 'g'), latex + ' ');
        }
    } else {
        // Text with inline math - convert only within |...|
        result = result.replace(/\|([^|]+)\|/g, (match, content) => {
            let latexContent = content;
            for (const [symbol, latex] of Object.entries(setLatexMap)) {
                latexContent = latexContent.replace(new RegExp(escapeRegex(symbol), 'g'), latex + ' ');
            }
            return '$\\lvert ' + latexContent + '\\rvert$';
        });
    }
    
    return result;
}

// Copy set theory as text
function copySetAsText() {
    const preText = document.getElementById('setPreText').value;
    const proofText = document.getElementById('setProofText').value;
    const postText = document.getElementById('setPostText').value;
    
    let text = '';
    
    if (preText) {
        text += 'Given:\n' + preText + '\n\n';
    }
    
    if (proofText) {
        text += 'Proof:\n' + proofText + '\n';
    }
    
    if (postText) {
        text += '\nTherefore:\n' + postText;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showSetCopyStatus();
    });
}

function showSetCopyStatus() {
    const status = document.getElementById('setCopyStatus');
    status.classList.add('show');
    setTimeout(() => {
        status.classList.remove('show');
    }, 2000);
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to initial proof inputs
    const proofInputs = document.querySelectorAll('.proof-input');
    const reasonInputs = document.querySelectorAll('.reason-input');
    
    proofInputs.forEach(input => {
        input.addEventListener('input', handleInput);
        input.addEventListener('input', updatePreview);
        input.addEventListener('keydown', handleEnterKey);
    });
    
    reasonInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('keydown', handleEnterKey);
    });
    
    // Add event listeners to text areas
    document.getElementById('preText').addEventListener('input', handleInput);
    document.getElementById('preText').addEventListener('input', updatePreview);
    document.getElementById('postText').addEventListener('input', handleInput);
    document.getElementById('postText').addEventListener('input', updatePreview);
    
    // Set theory event listeners
    const setInputs = document.querySelectorAll('.set-input');
    setInputs.forEach(input => {
        input.addEventListener('input', handleSetInput);
        input.addEventListener('input', updateSetPreview);
        input.addEventListener('keydown', handleSetKeydown);
    });
    
    // Load saved shortcuts
    loadSavedShortcuts();
});