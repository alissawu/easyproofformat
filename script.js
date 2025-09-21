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
    'v': '∨'
};

// Instant replacements (no space needed)
const instantReplacements = {
    '!': '¬',
    '~': '¬',
    '^': '∧'
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
    '∃': '\\exists',
    '∈': '\\in',
    '∅': '\\emptyset'
};

// Global variables
let lineCount = 1;
let allLines = [1];

// Optional shortcuts that can be toggled
const optionalShortcuts = {
    'forall': '∀',
    'exists': '∃',
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
                    value = value.substring(0, keyStart) + 
                            symbol + 
                            value.substring(keyStart + key.length);
                    newCursorPos = keyStart + symbol.length + 1;
                    break;
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
    
    // Add proof lines - first find the longest expression for alignment
    let maxExprLength = 0;
    lines.forEach((line, index) => {
        const expr = line.querySelector('.proof-input').value;
        if (expr) {
            const lineStart = `${index + 1}. ${expr}`;
            maxExprLength = Math.max(maxExprLength, lineStart.length);
        }
    });
    
    // Add padding to align reasons
    text += 'Proof:\n';
    lines.forEach((line, index) => {
        const expr = line.querySelector('.proof-input').value;
        const reason = line.querySelector('.reason-input').value;
        
        if (expr) {
            const lineStart = `${index + 1}. ${expr}`;
            text += lineStart;
            if (reason) {
                // Add spaces to align reasons
                const padding = ' '.repeat(Math.max(4, maxExprLength - lineStart.length + 4));
                text += padding + `[${reason}]`;
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
    
    // Load saved shortcuts
    loadSavedShortcuts();
});