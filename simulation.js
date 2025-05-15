const Config = {
    ANIMATION_SPEED: 80,
    MIN_SPEED: 20,
    MAX_SPEED: 200,
    DEFAULT_SPEED: 80,
    get stepDuration() {
        return this.ANIMATION_SPEED;
    }
};

// Add process states
const ProcessStates = {
    READY: 'ready',
    RUNNING: 'running',
    WAITING: 'waiting',
    COMPLETED: 'completed'
};

document.addEventListener('DOMContentLoaded', function() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const algorithm = urlParams.get('algorithm');
    const data = JSON.parse(decodeURIComponent(urlParams.get('data')));
    
    // Run the appropriate simulation based on the algorithm
    switch(algorithm) {
        case 'FCFS':
            runFCFSSimulation(data.arrivalTimes, data.burstTimes);
            break;
        case 'SJF':
            runSJFSimulation(data.arrivalTimes, data.burstTimes);
            break;
        case 'SRTF':
            runSRTFSimulation(data.arrivalTimes, data.burstTimes);
            break;
        case 'Priority':
            runPrioritySimulation(data.arrivalTimes, data.burstTimes, data.priorities);
            break;
        case 'RoundRobin':
            runRoundRobinSimulation(data.arrivalTimes, data.burstTimes, data.timeQuantum);
            break;
        default:
            showError('Invalid algorithm selected');
    }
});

function createGanttChartUI() {
    return `
        <div id="ganttChartContainer" class="gantt-chart-container" style="display: none;">
            <h2>Gantt Chart</h2>
            <div id="ganttChart" class="gantt-chart"></div>
            <div id="ganttLegend" class="gantt-legend"></div>
        </div>
    `;
}

function showGanttChart(timeline, totalTime, processCount) {
    console.log('Showing Gantt chart...');
    const ganttChartContainer = document.getElementById('ganttChartContainer');
    const ganttChart = document.getElementById('ganttChart');
    const ganttLegend = document.getElementById('ganttLegend');

    if (!ganttChartContainer || !ganttChart || !ganttLegend) {
        console.error('Gantt chart elements not found:', {
            container: ganttChartContainer,
            chart: ganttChart,
            legend: ganttLegend
        });
        return;
    }

    // Clear previous content
    ganttChart.innerHTML = '';
    ganttLegend.innerHTML = '';
    ganttChartContainer.style.display = 'block';

    // Ensure we have valid data
    if (!Array.isArray(timeline) || timeline.length === 0) {
        console.error('Invalid timeline data:', timeline);
        return;
    }

    console.log('Creating Gantt chart with:', {
        timelineLength: timeline.length,
        totalTime,
        processCount
    });

    const timeScale = 100 / totalTime; // percentage per time unit

    // Create legend
    const legendHTML = ['<div class="legend-title">Legend:</div>'];
    for (let i = 0; i < processCount; i++) {
        legendHTML.push(`
            <div class="legend-item">
                <span class="legend-color" style="background-color: ${getProcessColor(i)}"></span>
                <span class="legend-label">P${i}</span>
            </div>
        `);
    }
    legendHTML.push(`
        <div class="legend-item">
            <span class="legend-color gantt-idle"></span>
            <span class="legend-label">Idle</span>
        </div>
    `);
    ganttLegend.innerHTML = legendHTML.join('');

    // Create timeline grid
    const gridInterval = Math.ceil(totalTime / 10); // Create 10 grid lines
    for (let i = 0; i <= totalTime; i += gridInterval) {
        const gridLine = document.createElement('div');
        gridLine.className = 'gantt-grid-line';
        gridLine.style.left = `${i * timeScale}%`;
        ganttChart.appendChild(gridLine);
    }

    // Sort timeline by start time
    timeline.sort((a, b) => a.start - b.start);

    // Create and animate Gantt chart bars
    let delay = 0;
    timeline.forEach((entry, index) => {
        setTimeout(() => {
            const barContainer = document.createElement('div');
            barContainer.className = 'gantt-bar-container';
            
            const bar = document.createElement('div');
            bar.className = 'gantt-bar';
            bar.style.left = `${entry.start * timeScale}%`;
            bar.style.width = `${entry.duration * timeScale}%`;
            
            if (entry.type === 'idle') {
                bar.classList.add('gantt-idle');
                bar.innerHTML = `<span class="bar-label">Idle</span>`;
            } else {
                bar.style.backgroundColor = getProcessColor(entry.processId);
                bar.innerHTML = `<span class="bar-label">P${entry.processId}</span>`;
            }

            // Add time labels
            const startLabel = document.createElement('div');
            startLabel.className = 'gantt-time-label';
            startLabel.textContent = entry.start;
            startLabel.style.left = `${entry.start * timeScale}%`;

            const endLabel = document.createElement('div');
            endLabel.className = 'gantt-time-label';
            endLabel.textContent = entry.start + entry.duration;
            endLabel.style.left = `${(entry.start + entry.duration) * timeScale}%`;

            barContainer.appendChild(bar);
            ganttChart.appendChild(barContainer);
            ganttChart.appendChild(startLabel);
            ganttChart.appendChild(endLabel);

            // Add animation with speed-dependent duration
            bar.style.transform = 'scaleX(0)';
            bar.style.transformOrigin = 'left';
            requestAnimationFrame(() => {
                bar.style.transform = 'scaleX(1)';
                bar.style.transition = `transform ${Config.stepDuration * 0.5}ms ease-out`;
            });
        }, delay);
        delay += Config.stepDuration * 0.75; // Stagger the animations based on speed
    });
}

function getProcessColor(index) {
    const colors = [
        '#FF6B6B', // Coral Red
        '#4ECDC4', // Turquoise
        '#45B7D1', // Sky Blue
        '#96CEB4', // Sage Green
        '#FFEEAD', // Cream Yellow
        '#D4A5A5', // Dusty Rose
        '#9B5DE5', // Purple
        '#F15BB5', // Pink
        '#00BBF9', // Bright Blue
        '#00F5D4', // Mint
        '#FEE440', // Yellow
        '#FF99C8', // Light Pink
        '#A8E6CF', // Mint Green
        '#FFB7B2', // Peach
        '#B5EAD7'  // Seafoam
    ];
    return colors[index % colors.length];
}

function runFCFSSimulation(arrivalTimes, burstTimes) {
    // Create simulation container
    const simulationHTML = `
        <div class="simulation-container" id="fcfsSimulation">
            <div class="simulation-header">FCFS Simulator</div>
            
            <table class="process-table">
                <thead>
                    <tr>
                        <th>Process</th>
                        <th>Arrival Time</th>
                        <th>Burst Time</th>
                        <th>Waiting Time</th>
                        <th>Turnaround Time</th>
                    </tr>
                </thead>
                <tbody id="processTableBody"></tbody>
            </table>
            
            <div class="simulation-section">
                <h2>Status Bar</h2>
                <div id="simulationRows"></div>
            </div>
            
            <div class="stats-container">
                <div class="stat-row">
                    <span class="stat-label">Average Waiting Time:</span>
                    <span id="avgWaitingTime" class="stat-value"></span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Average Turnaround Time:</span>
                    <span id="avgTurnaroundTime" class="stat-value"></span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total Execution Time:</span>
                    <span id="totalExecutionTime" class="stat-value"></span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">CPU Idle Time:</span>
                    <span id="cpuIdleTime" class="stat-value"></span>
                </div>
            </div>
            
            <div class="button-container">
                <button id="simulationControlButton" class="control-button">Start Simulation</button>
                <button id="pauseResumeButton" class="control-button no-print" disabled>Pause</button>
                <button id="showGanttButton" class="control-button no-print" disabled>Show Gantt Chart</button>
                <button id="exportPdfButton" class="control-button pdf-button" disabled>Export PDF</button>
            </div>
            
            ${createSpeedControl()}
            
            <div id="ganttChartContainer" class="gantt-chart-container" style="display: none;">
                <h2>Gantt Chart</h2>
                <div id="ganttChart" class="gantt-chart"></div>
                <div id="ganttLegend" class="gantt-legend"></div>
            </div>
            
            <div class="keyboard-shortcuts">
                <h3>Keyboard Shortcuts</h3>
                <ul>
                    <li><kbd>Space</kbd> - Pause/Resume</li>
                    <li><kbd>G</kbd> - Show/Hide Gantt Chart</li>
                    <li><kbd>←</kbd><kbd>→</kbd> - Adjust Speed</li>
                    <li><kbd>Esc</kbd> - Exit</li>
                </ul>
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', simulationHTML);
    
    // Initialize UI
    const processTableBody = document.getElementById('processTableBody');
    const simulationRows = document.getElementById('simulationRows');
    
    // Create process table rows
    arrivalTimes.forEach((arrival, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>P${i}</td>
            <td>${arrival}</td>
            <td>${burstTimes[i]}</td>
            <td id="waitingTime${i}"></td>
            <td id="turnaroundTime${i}"></td>
        `;
        processTableBody.appendChild(row);
    });
    
    // Create simulation rows
    arrivalTimes.forEach((_, i) => {
        const row = document.createElement('div');
        row.innerHTML = createProcessRow(i, burstTimes[i]);
        simulationRows.appendChild(row);
    });
    
    // Setup control buttons
    const controlButton = document.getElementById('simulationControlButton');
    const pauseResumeButton = document.getElementById('pauseResumeButton');
    const showGanttButton = document.getElementById('showGanttButton');
    let isPaused = false;
    let simulationPromiseResolve = null;

    controlButton.addEventListener('click', startFCFSAnimation);
    pauseResumeButton.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseResumeButton.textContent = isPaused ? 'Resume' : 'Pause';
        if (!isPaused && simulationPromiseResolve) {
            simulationPromiseResolve();
            simulationPromiseResolve = null;
        }
    });
    
    // Store execution timeline for Gantt chart
    let executionTimeline = [];
    
    // FCFS Algorithm with Animation
    async function startFCFSAnimation() {
        controlButton.disabled = true;
        controlButton.textContent = "Running...";
        pauseResumeButton.disabled = false;
        
        const waitingTimes = new Array(arrivalTimes.length).fill(0);
        const turnaroundTimes = new Array(arrivalTimes.length).fill(0);
        let currentTime = 0;
        let idleTime = 0;
        
        // Sort processes by arrival time
        const processes = arrivalTimes.map((arrival, index) => ({
            id: index,
            arrival,
            burst: burstTimes[index]
        })).sort((a, b) => a.arrival - b.arrival);
        
        // Process each in FCFS order
        for (const process of processes) {
            // Handle idle time if CPU is waiting
            if (currentTime < process.arrival) {
                const idleDuration = process.arrival - currentTime;
                idleTime += idleDuration;
                executionTimeline.push({
                    type: 'idle',
                    start: currentTime,
                    duration: idleDuration
                });
                currentTime = process.arrival;
            }
            
            // Add process execution to timeline
            executionTimeline.push({
                type: 'process',
                processId: process.id,
                start: currentTime,
                duration: process.burst
            });
            
            // Animate progress bar
            const progressBar = document.getElementById(`progressBar${process.id}`);
            const remainingTime = document.getElementById(`remainingTime${process.id}`);
            
            const steps = Math.max(10, process.burst * 5);
            
            for (let step = 1; step <= steps; step++) {
                while (isPaused) {
                    await new Promise(resolve => {
                        simulationPromiseResolve = resolve;
                    });
                }

                const progress = (step / steps) * 100;
                progressBar.style.width = `${progress}%`;
                
                const remaining = Math.max(0, process.burst - (process.burst * step / steps));
                remainingTime.textContent = `${Math.round(remaining)}ms`;
                
                await new Promise(resolve => setTimeout(resolve, Config.stepDuration));
            }
            
            // Calculate times
            currentTime += process.burst;
            turnaroundTimes[process.id] = currentTime - process.arrival;
            waitingTimes[process.id] = turnaroundTimes[process.id] - process.burst;
            
            // Update table
            document.getElementById(`waitingTime${process.id}`).textContent = waitingTimes[process.id];
            document.getElementById(`turnaroundTime${process.id}`).textContent = turnaroundTimes[process.id];
        }
        
        // Calculate and display stats
        const avgWaitingTime = waitingTimes.reduce((sum, time) => sum + time, 0) / waitingTimes.length;
        const avgTurnaroundTime = turnaroundTimes.reduce((sum, time) => sum + time, 0) / turnaroundTimes.length;
        
        document.getElementById('avgWaitingTime').textContent = `${avgWaitingTime.toFixed(2)} ms`;
        document.getElementById('avgTurnaroundTime').textContent = `${avgTurnaroundTime.toFixed(2)} ms`;
        document.getElementById('totalExecutionTime').textContent = `${currentTime.toFixed(2)} ms`;
        document.getElementById('cpuIdleTime').textContent = `${idleTime.toFixed(2)} ms`;
        
        // Enable Gantt chart button and set up click handler
        showGanttButton.disabled = false;
        showGanttButton.onclick = () => {
            console.log('Show Gantt button clicked');
            console.log('Timeline:', executionTimeline);
            console.log('Total time:', currentTime);
            console.log('Process count:', arrivalTimes.length);
            showGanttChart(executionTimeline, currentTime, arrivalTimes.length);
        };
        
        // Change button to exit
        controlButton.textContent = "Exit";
        controlButton.className = "control-button exit";
        controlButton.disabled = false;
        pauseResumeButton.disabled = true;
        controlButton.onclick = () => {
            document.getElementById('fcfsSimulation').remove();
            window.close();
        };

        // After simulation completes and stats are displayed
        document.getElementById('exportPdfButton').disabled = false;
        initializePDFButton();
    }
}

function runSJFSimulation(arrivalTimes, burstTimes) {
    // Create simulation container
    const simulationHTML = `
        <div class="simulation-container" id="sjfSimulation">
            <div class="simulation-header">SJF (Shortest Job First) Simulation</div>
            
            <table class="process-table">
                <thead>
                    <tr>
                        <th>Process</th>
                        <th>Arrival Time</th>
                        <th>Burst Time</th>
                        <th>Completion Time</th>
                        <th>Waiting Time</th>
                        <th>Turnaround Time</th>
                    </tr>
                </thead>
                <tbody id="processTableBody"></tbody>
            </table>
            
            <div class="simulation-section">
                <h2>Execution Timeline</h2>
                <div id="timeline"></div>
            </div>
            
            <div class="stats-container">
                <div class="stat-row">
                    <span class="stat-label">Average Waiting Time:</span>
                    <span id="avgWaitingTime" class="stat-value"></span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Average Turnaround Time:</span>
                    <span id="avgTurnaroundTime" class="stat-value"></span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total Execution Time:</span>
                    <span id="totalExecutionTime" class="stat-value"></span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">CPU Idle Time:</span>
                    <span id="cpuIdleTime" class="stat-value"></span>
                </div>
            </div>
            
            <div class="button-container">
                <button id="simulationControlButton" class="control-button">Start Simulation</button>
                <button id="pauseResumeButton" class="control-button" disabled>Pause</button>
                <button id="showGanttButton" class="control-button" disabled>Show Gantt Chart</button>
            </div>

            ${createGanttChartUI()}
        </div>
    `;
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', simulationHTML);
    
    // Initialize UI
    const processTableBody = document.getElementById('processTableBody');
    const timeline = document.getElementById('timeline');
    
    // Create process table rows
    arrivalTimes.forEach((arrival, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>P${i}</td>
            <td>${arrival}</td>
            <td>${burstTimes[i]}</td>
            <td id="completionTime${i}"></td>
            <td id="waitingTime${i}"></td>
            <td id="turnaroundTime${i}"></td>
        `;
        processTableBody.appendChild(row);
    });
    
    // Setup control buttons
    const controlButton = document.getElementById('simulationControlButton');
    const pauseResumeButton = document.getElementById('pauseResumeButton');
    const showGanttButton = document.getElementById('showGanttButton');
    let isPaused = false;
    let simulationPromiseResolve = null;

    controlButton.addEventListener('click', startSJFAnimation);
    pauseResumeButton.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseResumeButton.textContent = isPaused ? 'Resume' : 'Pause';
        if (!isPaused && simulationPromiseResolve) {
            simulationPromiseResolve();
            simulationPromiseResolve = null;
        }
    });
    
    // Store execution timeline for Gantt chart
    let executionTimeline = [];
    
    // SJF Algorithm with Animation
    async function startSJFAnimation() {
        controlButton.disabled = true;
        controlButton.textContent = "Running...";
        pauseResumeButton.disabled = false;
        
        const n = arrivalTimes.length;
        const completionTimes = new Array(n).fill(0);
        const turnaroundTimes = new Array(n).fill(0);
        const waitingTimes = new Array(n).fill(0);
        let currentTime = 0;
        let totalIdleTime = 0;
        let processesCompleted = 0;
        
        // Create process objects
        const processes = arrivalTimes.map((arrival, index) => ({
            id: index,
            arrival,
            burst: burstTimes[index],
            remaining: burstTimes[index],
            completed: false
        }));
        
        while (processesCompleted < n) {
            // Find arrived processes with remaining burst time
            const availableProcesses = processes.filter(p => 
                !p.completed && p.arrival <= currentTime
            );
            
            if (availableProcesses.length === 0) {
                // CPU is idle
                const nextArrival = Math.min(...processes
                    .filter(p => !p.completed)
                    .map(p => p.arrival));
                const idleTime = nextArrival - currentTime;
                totalIdleTime += idleTime;
                
                executionTimeline.push({
                    type: 'idle',
                    start: currentTime,
                    duration: idleTime
                });
                
                currentTime = nextArrival;
                continue;
            }
            
            // Find process with shortest burst time
            const currentProcess = availableProcesses
                .reduce((min, p) => p.burst < min.burst ? p : min, availableProcesses[0]);
            
            while (isPaused) {
                await new Promise(resolve => {
                    simulationPromiseResolve = resolve;
                });
            }

            // Execute the process
            executionTimeline.push({
                type: 'process',
                processId: currentProcess.id,
                start: currentTime,
                duration: currentProcess.burst
            });

            // Animate the execution
            const steps = Math.max(10, currentProcess.burst * 5);
            
            for (let step = 1; step <= steps; step++) {
                while (isPaused) {
                    await new Promise(resolve => {
                        simulationPromiseResolve = resolve;
                    });
                }
                
                await new Promise(resolve => setTimeout(resolve, Config.stepDuration));
            }
            
            currentTime += currentProcess.burst;
            currentProcess.completed = true;
            processesCompleted++;
            
            // Calculate times
            completionTimes[currentProcess.id] = currentTime;
            turnaroundTimes[currentProcess.id] = currentTime - currentProcess.arrival;
            waitingTimes[currentProcess.id] = turnaroundTimes[currentProcess.id] - currentProcess.burst;
            
            // Update table
            document.getElementById(`completionTime${currentProcess.id}`).textContent = currentTime;
            document.getElementById(`waitingTime${currentProcess.id}`).textContent = waitingTimes[currentProcess.id];
            document.getElementById(`turnaroundTime${currentProcess.id}`).textContent = turnaroundTimes[currentProcess.id];
        }
        
        // Calculate and display stats
        const avgWaitingTime = waitingTimes.reduce((sum, time) => sum + time, 0) / n;
        const avgTurnaroundTime = turnaroundTimes.reduce((sum, time) => sum + time, 0) / n;
        
        document.getElementById('avgWaitingTime').textContent = `${avgWaitingTime.toFixed(2)} units`;
        document.getElementById('avgTurnaroundTime').textContent = `${avgTurnaroundTime.toFixed(2)} units`;
        document.getElementById('totalExecutionTime').textContent = `${currentTime} units`;
        document.getElementById('cpuIdleTime').textContent = `${totalIdleTime} units`;
        
        // Enable Gantt chart button
        showGanttButton.disabled = false;
        showGanttButton.onclick = () => showGanttChart(executionTimeline, currentTime, arrivalTimes.length);
        
        // Change button to exit
        controlButton.textContent = "Exit";
        controlButton.className = "control-button exit";
        controlButton.disabled = false;
        pauseResumeButton.disabled = true;
        controlButton.onclick = () => {
            document.getElementById('sjfSimulation').remove();
            window.close();
        };

        // After simulation completes and stats are displayed
        document.getElementById('exportPdfButton').disabled = false;
        initializePDFButton();
    }
}

function runPrioritySimulation(arrivalTimes, burstTimes, priorities) {
    const n = arrivalTimes.length;
    const simulationHTML = `
        <div class="simulation-container" id="prioritySimulation">
            <div class="simulation-header">Priority Scheduling Simulation</div>
            <table class="process-table">
                <thead>
                    <tr>
                        <th>Process</th>
                        <th>Arrival Time</th>
                        <th>Burst Time</th>
                        <th>Priority</th>
                        <th>Waiting Time</th>
                        <th>Turnaround Time</th>
                    </tr>
                </thead>
                <tbody id="processTableBody"></tbody>
            </table>

            <div class="simulation-section">
                <h2>Status Bar</h2>
                <div id="simulationRows"></div>
            </div>

            <div class="stats-container">
                <div class="stat-row"><span class="stat-label">Average Waiting Time:</span> <span id="avgWaitingTime"></span></div>
                <div class="stat-row"><span class="stat-label">Average Turnaround Time:</span> <span id="avgTurnaroundTime"></span></div>
                <div class="stat-row"><span class="stat-label">Total Execution Time:</span> <span id="totalExecutionTime"></span></div>
                <div class="stat-row"><span class="stat-label">CPU Idle Time:</span> <span id="cpuIdleTime"></span></div>
            </div>

            <div class="button-container">
                <button id="simulationControlButton" class="control-button">Start Simulation</button>
                <button id="pauseResumeButton" class="control-button" disabled>Pause</button>
                <button id="showGanttButton" class="control-button" disabled>Show Gantt Chart</button>
            </div>

            ${createGanttChartUI()}
        </div>
    `;
    document.getElementById("simulationContainer").innerHTML = simulationHTML;

    const processTableBody = document.getElementById("processTableBody");
    const simulationRows = document.getElementById("simulationRows");

    // Setup control buttons
    const controlButton = document.getElementById("simulationControlButton");
    const pauseResumeButton = document.getElementById("pauseResumeButton");
    const showGanttButton = document.getElementById("showGanttButton");
    let isPaused = false;
    let simulationPromiseResolve = null;

    // Initialize process table
    for (let i = 0; i < n; i++) {
        processTableBody.innerHTML += `
            <tr>
                <td>P${i}</td>
                <td>${arrivalTimes[i]}</td>
                <td>${burstTimes[i]}</td>
                <td>${priorities[i]}</td>
                <td id="waitingTime${i}"></td>
                <td id="turnaroundTime${i}"></td>
            </tr>
        `;

        simulationRows.innerHTML += createProcessRow(i, burstTimes[i]);
    }

    // Store execution timeline for Gantt chart
    let executionTimeline = [];

    // Setup pause/resume functionality
    pauseResumeButton.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseResumeButton.textContent = isPaused ? 'Resume' : 'Pause';
        if (!isPaused && simulationPromiseResolve) {
            simulationPromiseResolve();
            simulationPromiseResolve = null;
        }
    });

    controlButton.onclick = async () => {
        const remaining = [...burstTimes];
        const waiting = Array(n).fill(0);
        const turnaround = Array(n).fill(0);
        const completed = Array(n).fill(false);
        let completedCount = 0;
        let currentTime = 0;
        let idleTime = 0;

        controlButton.disabled = true;
        controlButton.textContent = "Running...";
        pauseResumeButton.disabled = false;

        function getProcess() {
            let maxPriority = -Infinity, index = -1;
            for (let i = 0; i < n; i++) {
                if (!completed[i] && arrivalTimes[i] <= currentTime) {
                    if (priorities[i] > maxPriority || (priorities[i] === maxPriority && remaining[i] < remaining[index])) {
                        maxPriority = priorities[i];
                        index = i;
                    }
                }
            }
            return index;
        }

        while (completedCount < n) {
            const pid = getProcess();
            
            if (pid === -1) {
                // CPU is idle
                const nextArrival = Math.min(...arrivalTimes.filter((_, i) => !completed[i]));
                const idleDuration = nextArrival - currentTime;
                currentTime++;
                idleTime++;
                
                executionTimeline.push({
                    type: 'idle',
                    start: currentTime - 1,
                    duration: 1
                });
                
                await new Promise(res => setTimeout(res, 100));
                continue;
            }

            while (isPaused) {
                await new Promise(resolve => {
                    simulationPromiseResolve = resolve;
                });
            }

            // Execute process
            executionTimeline.push({
                type: 'process',
                processId: pid,
                start: currentTime,
                duration: 1
            });

            remaining[pid]--;
            currentTime++;

            const progress = ((burstTimes[pid] - remaining[pid]) / burstTimes[pid]) * 100;
            document.getElementById(`progressBar${pid}`).style.width = `${progress}%`;
            document.getElementById(`remainingTime${pid}`).textContent = `${remaining[pid]}ms`;

            await new Promise(res => setTimeout(res, Config.stepDuration));

            if (remaining[pid] === 0) {
                turnaround[pid] = currentTime - arrivalTimes[pid];
                waiting[pid] = turnaround[pid] - burstTimes[pid];
                completed[pid] = true;
                completedCount++;

                document.getElementById(`waitingTime${pid}`).textContent = waiting[pid];
                document.getElementById(`turnaroundTime${pid}`).textContent = turnaround[pid];
            }
        }

        const avgWT = waiting.reduce((a, b) => a + b, 0) / n;
        const avgTAT = turnaround.reduce((a, b) => a + b, 0) / n;

        document.getElementById("avgWaitingTime").textContent = `${avgWT.toFixed(2)} ms`;
        document.getElementById("avgTurnaroundTime").textContent = `${avgTAT.toFixed(2)} ms`;
        document.getElementById("totalExecutionTime").textContent = `${currentTime} ms`;
        document.getElementById("cpuIdleTime").textContent = `${idleTime} ms`;

        // Enable Gantt chart button
        showGanttButton.disabled = false;
        showGanttButton.onclick = () => showGanttChart(executionTimeline, currentTime, arrivalTimes.length);

        // Change button to exit
        const button = document.getElementById("simulationControlButton");
        button.disabled = false;
        button.textContent = "Exit";
        button.className = "control-button exit";
        pauseResumeButton.disabled = true;
        button.onclick = () => {
            document.getElementById("prioritySimulation").remove();
            window.close();
        };

        // After simulation completes and stats are displayed
        document.getElementById('exportPdfButton').disabled = false;
        initializePDFButton();
    };
}

function showError(message) {
    const container = document.getElementById('simulationContainer');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    container.appendChild(errorDiv);
}

// Update the CSS styles for better visibility and animation
const ganttStyles = document.createElement('style');
ganttStyles.textContent = `
    .gantt-chart-container {
        margin-top: 30px;
        padding: 20px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .gantt-chart {
        position: relative;
        height: 120px;
        background: #f8f9fa;
        margin: 20px 0;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        overflow: visible;
        padding: 20px 0 40px 0;
    }

    .gantt-grid-line {
        position: absolute;
        top: 0;
        height: 100%;
        width: 1px;
        background: rgba(0, 0, 0, 0.1);
        z-index: 1;
    }

    .gantt-bar-container {
        position: relative;
        height: 100%;
    }

    .gantt-bar {
        position: absolute;
        height: 50px;
        top: 25px;
        border-radius: 6px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 2;
        overflow: hidden;
        min-width: 30px;
    }

    .gantt-idle {
        background: repeating-linear-gradient(
            45deg,
            #cccccc,
            #cccccc 10px,
            #d9d9d9 10px,
            #d9d9d9 20px
        );
    }

    .gantt-time-label {
        position: absolute;
        bottom: -25px;
        transform: translateX(-50%);
        font-size: 12px;
        color: #495057;
        font-weight: 500;
        z-index: 3;
    }

    .bar-label {
        position: absolute;
        width: 100%;
        text-align: center;
        font-size: 12px;
        font-weight: bold;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 5px;
    }

    .gantt-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        margin-top: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        justify-content: center;
    }

    .legend-title {
        width: 100%;
        text-align: center;
        font-weight: bold;
        margin-bottom: 10px;
        color: #495057;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        padding: 4px 8px;
        border-radius: 4px;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .legend-color {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        border: 1px solid rgba(0,0,0,0.1);
    }

    .legend-label {
        font-weight: 500;
        color: #495057;
    }

    .button-container {
        display: flex;
        gap: 10px;
        margin: 20px 0;
        justify-content: center;
    }

    .control-button {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        background: #007bff;
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .control-button:disabled {
        background: #6c757d;
        cursor: not-allowed;
    }

    .control-button:hover:not(:disabled) {
        background: #0056b3;
    }

    .control-button.exit {
        background: #dc3545;
    }

    .control-button.exit:hover {
        background: #c82333;
    }

    .speed-control {
        margin: 20px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: center;
    }

    .speed-control input[type="range"] {
        width: 200px;
    }

    .keyboard-shortcuts {
        margin-top: 20px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
    }

    .keyboard-shortcuts h3 {
        margin: 0 0 10px 0;
        color: #fff;
    }

    .keyboard-shortcuts ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        justify-content: center;
    }

    .keyboard-shortcuts li {
        color: #fff;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    kbd {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9em;
    }

    .process-state {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.9em;
        font-weight: 500;
        min-width: 80px;
        text-align: center;
        margin-right: 10px;
    }

    .process-state.ready {
        background: #ffd700;
        color: #000;
    }

    .process-state.running {
        background: #4caf50;
        color: #fff;
    }

    .process-state.waiting {
        background: #ff9800;
        color: #fff;
    }

    .process-state.completed {
        background: #2196f3;
        color: #fff;
    }

    .process-tooltip {
        position: absolute;
        right: -220px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 8px;
        border-radius: 4px;
        font-size: 0.9em;
        display: none;
        width: 200px;
        z-index: 100;
    }

    .simulation-row:hover .process-tooltip {
        display: block;
    }

    .gantt-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        padding: 8px;
        border-radius: 4px;
        font-size: 0.9em;
        display: none;
        white-space: nowrap;
        z-index: 100;
        pointer-events: none;
    }

    .simulation-row {
        position: relative;
    }
`;

// Ensure we remove any existing style element before adding the new one
const existingStyle = document.getElementById('ganttStyles');
if (existingStyle) {
    existingStyle.remove();
}
ganttStyles.id = 'ganttStyles';
document.head.appendChild(ganttStyles);

function createSpeedControl() {
    return `
        <div class="speed-control">
            <label>Animation Speed:</label>
            <input type="range" id="speedControl" 
                min="${Config.MIN_SPEED}" 
                max="${Config.MAX_SPEED}" 
                value="${Config.DEFAULT_SPEED}"
                step="10">
            <span id="speedValue">${Config.DEFAULT_SPEED}ms</span>
        </div>
    `;
}

// Add keyboard event listeners
document.addEventListener('keydown', function(e) {
    // Only handle keyboard shortcuts if simulation is running
    if (!document.getElementById('fcfsSimulation')) return;
    
    switch(e.key) {
        case ' ': // Space
            e.preventDefault();
            const pauseBtn = document.getElementById('pauseResumeButton');
            if (!pauseBtn.disabled) pauseBtn.click();
            break;
        case 'g':
        case 'G':
            const ganttBtn = document.getElementById('showGanttButton');
            if (!ganttBtn.disabled) ganttBtn.click();
            break;
        case 'Escape':
            const exitBtn = document.getElementById('simulationControlButton');
            if (exitBtn.textContent === 'Exit') exitBtn.click();
            break;
        case 'ArrowLeft':
            adjustSpeed(-10);
            break;
        case 'ArrowRight':
            adjustSpeed(10);
            break;
    }
});

// Add speed control functions
function adjustSpeed(delta) {
    const speedControl = document.getElementById('speedControl');
    if (speedControl) {
        const newValue = Math.max(Config.MIN_SPEED, 
            Math.min(Config.MAX_SPEED, 
                parseInt(speedControl.value) + delta));
        speedControl.value = newValue;
        updateSpeed(newValue);
    }
}

function updateSpeed(speed) {
    document.getElementById('speedValue').textContent = `${speed}ms`;
    Config.ANIMATION_SPEED = speed;
    // Update the tooltip to show the new speed effect
    const tooltip = document.createElement('div');
    tooltip.className = 'speed-tooltip';
    tooltip.textContent = `Animation speed: ${speed}ms`;
    document.body.appendChild(tooltip);
    setTimeout(() => tooltip.remove(), 1000);
}

// Add speed control event listener in the initialization
const speedControl = document.getElementById('speedControl');
speedControl.addEventListener('input', (e) => {
    updateSpeed(parseInt(e.target.value));
});

// Update the process row creation in simulation rows
function createProcessRow(processId, burstTime) {
    return `
        <div class="simulation-row">
            <div class="process-label">P${processId}:</div>
            <div class="process-state" id="processState${processId}">Ready</div>
            <div class="progress-container">
                <div id="progressBar${processId}" class="progress-bar"></div>
            </div>
            <div id="remainingTime${processId}" class="remaining-time">${burstTime}ms</div>
            <div class="process-tooltip" id="processTooltip${processId}"></div>
        </div>
    `;
}

// Update the showGanttChart function to add tooltips
function addGanttTooltip(bar, data) {
    const tooltip = document.createElement('div');
    tooltip.className = 'gantt-tooltip';
    if (data.type === 'process') {
        tooltip.innerHTML = `
            <strong>Process P${data.processId}</strong><br>
            Start: ${data.start}ms<br>
            Duration: ${data.duration}ms<br>
            End: ${data.start + data.duration}ms
        `;
    } else {
        tooltip.innerHTML = `
            <strong>CPU Idle</strong><br>
            Start: ${data.start}ms<br>
            Duration: ${data.duration}ms
        `;
    }
    bar.appendChild(tooltip);
    
    bar.addEventListener('mouseenter', () => tooltip.style.display = 'block');
    bar.addEventListener('mouseleave', () => tooltip.style.display = 'none');
}

// Update process state
function updateProcessState(processId, state) {
    const stateElement = document.getElementById(`processState${processId}`);
    if (stateElement) {
        stateElement.className = `process-state ${state.toLowerCase()}`;
        stateElement.textContent = state;
    }
}

// Update process tooltip
function updateProcessTooltip(processId, data) {
    const tooltip = document.getElementById(`processTooltip${processId}`);
    if (tooltip) {
        tooltip.innerHTML = `
            Arrival: ${data.arrival}ms<br>
            Burst: ${data.burst}ms<br>
            Waiting: ${data.waiting}ms<br>
            Turnaround: ${data.turnaround}ms
        `;
    }
}

// Add speed-related styles
const speedStyles = `
    .speed-control {
        margin: 20px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        padding: 10px;
        border-radius: 8px;
    }

    .speed-control label {
        color: #fff;
        font-weight: 500;
    }

    .speed-control input[type="range"] {
        width: 200px;
        height: 6px;
        -webkit-appearance: none;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        outline: none;
    }

    .speed-control input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #4CAF50;
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.2s;
    }

    .speed-control input[type="range"]::-webkit-slider-thumb:hover {
        background: #45a049;
    }

    .speed-control #speedValue {
        min-width: 60px;
        text-align: center;
        color: #fff;
        font-family: monospace;
    }

    .speed-tooltip {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeInOut 1s ease-in-out;
    }

    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -20px); }
        20% { opacity: 1; transform: translate(-50%, 0); }
        80% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -20px); }
    }
`;

// Add the speed styles to the existing styles
ganttStyles.textContent += speedStyles;

// Add this function near the top of the file
function initializePDFButton() {
    const exportPdfButton = document.getElementById('exportPdfButton');
    if (exportPdfButton) {
        exportPdfButton.onclick = generatePDF;
    }
}

function generatePDF() {
    // Get the simulation container
    const element = document.querySelector('.simulation-container');
    
    // Create a clone of the element to modify for PDF
    const pdfContent = element.cloneNode(true);
    
    // Add PDF header
    const header = document.createElement('div');
    header.className = 'pdf-header';
    header.innerHTML = `
        <h1>CPU Scheduling Simulation Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    `;
    pdfContent.insertBefore(header, pdfContent.firstChild);
    
    // Show Gantt chart if it's hidden
    const ganttContainer = pdfContent.querySelector('#ganttChartContainer');
    if (ganttContainer) {
        ganttContainer.style.display = 'block';
    }

    // Add page break before Gantt chart
    if (ganttContainer) {
        ganttContainer.style.pageBreakBefore = 'always';
    }

    // Configure PDF options
    const opt = {
        margin: [15, 15, 15, 15], // top, right, bottom, left margins in mm
        filename: 'CPU_Scheduling_Simulation.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        },
        pagebreak: { mode: 'avoid-all' }
    };

    // Add watermark class for PDF
    pdfContent.classList.add('pdf-mode');

    // Generate PDF
    html2pdf().set(opt).from(pdfContent).save()
        .then(() => {
            showToast('PDF generated successfully!', 'success');
        })
        .catch(err => {
            console.error('PDF generation error:', err);
            showToast('Error generating PDF', 'error');
        });
}

// Add toast notification function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
}

// Update PDF styles
const pdfStyles = `
    .pdf-button {
        background: #ff5722 !important;
    }
    
    .pdf-button:hover {
        background: #f4511e !important;
    }

    .pdf-header {
        text-align: center;
        margin-bottom: 30px;
        padding: 20px;
        border-bottom: 2px solid #ddd;
        background: white;
        color: black;
    }

    .pdf-header h1 {
        margin: 0;
        color: #333;
        font-size: 24px;
        font-weight: bold;
    }

    .pdf-header p {
        margin: 10px 0 0;
        color: #666;
        font-size: 14px;
    }

    /* PDF-specific styles */
    .pdf-mode {
        background: white !important;
        color: black !important;
        padding: 20px !important;
    }

    .pdf-mode .simulation-header {
        color: #333 !important;
        font-size: 20px !important;
        margin-bottom: 30px !important;
    }

    .pdf-mode .process-table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-bottom: 30px !important;
        color: black !important;
    }

    .pdf-mode .process-table th,
    .pdf-mode .process-table td {
        border: 1px solid #ddd !important;
        padding: 8px !important;
        text-align: center !important;
        color: black !important;
        background: white !important;
    }

    .pdf-mode .process-table th {
        background: #f5f5f5 !important;
        font-weight: bold !important;
    }

    .pdf-mode .stats-container {
        margin: 20px 0 !important;
        padding: 15px !important;
        border: 1px solid #ddd !important;
        border-radius: 5px !important;
        background: #f9f9f9 !important;
    }

    .pdf-mode .stat-row {
        color: black !important;
        margin: 10px 0 !important;
        display: flex !important;
        justify-content: space-between !important;
    }

    .pdf-mode .stat-label {
        font-weight: bold !important;
        color: #333 !important;
    }

    .pdf-mode .stat-value {
        color: #666 !important;
    }

    .pdf-mode .gantt-chart-container {
        page-break-before: always !important;
        margin-top: 30px !important;
        padding: 20px !important;
        background: white !important;
        border: 1px solid #ddd !important;
    }

    .pdf-mode .gantt-chart {
        height: 150px !important;
        background: #f8f9fa !important;
        border: 1px solid #dee2e6 !important;
    }

    .pdf-mode .gantt-bar {
        height: 40px !important;
        border: 1px solid rgba(0,0,0,0.2) !important;
    }

    .pdf-mode .gantt-legend {
        margin-top: 20px !important;
        border-top: 1px solid #ddd !important;
        padding-top: 15px !important;
    }

    .pdf-mode .legend-item {
        background: white !important;
        border: 1px solid #ddd !important;
        color: black !important;
    }

    .pdf-mode .no-print {
        display: none !important;
    }

    @media print {
        .pdf-mode {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
    }
`;

// Add the PDF styles to existing styles
ganttStyles.textContent += pdfStyles;