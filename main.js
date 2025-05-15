document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const algorithmSelect = document.getElementById('algorithm');
    const processCountSelect = document.getElementById('processCount');
    const confirmBtn = document.getElementById('confirmBtn');
    const inputFieldsContainer = document.getElementById('inputFields');
    const timeQuantumField = document.getElementById('timeQuantumField');
    const startSimulationBtn = document.getElementById('startSimulationBtn');
    
    // Event listeners
    confirmBtn.addEventListener('click', createInputFields);
    startSimulationBtn.addEventListener('click', startSimulation);
    
    // Global variables to store input values
    let arrivalInputs = [];
    let burstInputs = [];
    let priorityInputs = [];
    
    function createInputFields() {
        // Clear previous inputs
        inputFieldsContainer.innerHTML = '';
        arrivalInputs = [];
        burstInputs = [];
        priorityInputs = [];
        
        const algorithm = algorithmSelect.value;
        const processCount = parseInt(processCountSelect.value);
        
        // Create table for input fields
        const table = document.createElement('table');
        table.className = 'process-table';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const processHeader = document.createElement('th');
        processHeader.textContent = 'Process';
        headerRow.appendChild(processHeader);
        
        const arrivalHeader = document.createElement('th');
        arrivalHeader.textContent = 'Arrival';
        headerRow.appendChild(arrivalHeader);
        
        const burstHeader = document.createElement('th');
        burstHeader.textContent = 'Burst';
        headerRow.appendChild(burstHeader);
        
        if (algorithm === 'Priority') {
            const priorityHeader = document.createElement('th');
            priorityHeader.textContent = 'Priority';
            headerRow.appendChild(priorityHeader);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body with input fields
        const tbody = document.createElement('tbody');
        
        for (let i = 0; i < processCount; i++) {
            const row = document.createElement('tr');
            
            // Process label
            const processCell = document.createElement('td');
            processCell.textContent = `P${i}`;
            row.appendChild(processCell);
            
            // Arrival time input
            const arrivalCell = document.createElement('td');
            const arrivalInput = document.createElement('input');
            arrivalInput.type = 'number';
            arrivalInput.min = '0';
            arrivalInput.value = '0';
            arrivalInput.className = 'arrival-input';
            arrivalCell.appendChild(arrivalInput);
            row.appendChild(arrivalCell);
            arrivalInputs.push(arrivalInput);
            
            // Burst time input
            const burstCell = document.createElement('td');
            const burstInput = document.createElement('input');
            burstInput.type = 'number';
            burstInput.min = '1';
            burstInput.value = '1';
            burstInput.className = 'burst-input';
            burstCell.appendChild(burstInput);
            row.appendChild(burstCell);
            burstInputs.push(burstInput);
            
            // Priority input (if Priority algorithm)
            if (algorithm === 'Priority') {
                const priorityCell = document.createElement('td');
                const priorityInput = document.createElement('input');
                priorityInput.type = 'number';
                priorityInput.min = '1';
                priorityInput.value = '1';
                priorityInput.className = 'priority-input';
                priorityCell.appendChild(priorityInput);
                row.appendChild(priorityCell);
                priorityInputs.push(priorityInput);
            }
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        inputFieldsContainer.appendChild(table);
        
        // Show/hide time quantum field for Round Robin
        if (algorithm === 'RoundRobin') {
            timeQuantumField.style.display = 'flex';
        } else {
            timeQuantumField.style.display = 'none';
        }
        
        // Show start simulation button
        startSimulationBtn.style.display = 'block';
    }
    
    function startSimulation() {
        // Validate inputs
        if (!validateInputs()) {
            return;
        }
        
        const algorithm = algorithmSelect.value;
        const arrivalTimes = arrivalInputs.map(input => parseInt(input.value));
        const burstTimes = burstInputs.map(input => parseInt(input.value));
        
        // Prepare data object
        const simulationData = {
            arrivalTimes,
            burstTimes
        };
        
        // Add algorithm-specific data
        if (algorithm === 'Priority') {
            simulationData.priorities = priorityInputs.map(input => parseInt(input.value));
        }
        if (algorithm === 'RoundRobin') {
            simulationData.timeQuantum = parseInt(document.getElementById('timeQuantum').value);
        }
        
        // Encode data for URL
        const encodedData = encodeURIComponent(JSON.stringify(simulationData));
        
        // Open new tab with simulation
        window.open(`simulation.html?algorithm=${algorithm}&data=${encodedData}`, '_blank');
    }
    
    function validateInputs() {
        // Check all arrival and burst inputs are filled
        for (const input of arrivalInputs.concat(burstInputs)) {
            if (!input.value.trim()) {
                showError('Please fill all input fields.');
                return false;
            }
            
            if (isNaN(parseInt(input.value))) {
                showError('Please enter valid numbers in all fields.');
                return false;
            }
        }
        
        // Check priority inputs if Priority algorithm
        if (algorithmSelect.value === 'Priority') {
            for (const input of priorityInputs) {
                if (!input.value.trim()) {
                    showError('Please fill all input fields.');
                    return false;
                }
                
                if (isNaN(parseInt(input.value))) {
                    showError('Please enter valid numbers in all fields.');
                    return false;
                }
            }
        }
        
        // Check time quantum if Round Robin
        if (algorithmSelect.value === 'RoundRobin') {
            const timeQuantum = document.getElementById('timeQuantum').value;
            if (!timeQuantum.trim()) {
                showError('Please enter time quantum.');
                return false;
            }
            
            if (isNaN(parseInt(timeQuantum))) {
                showError('Please enter a valid number for time quantum.');
                return false;
            }
        }
        
        return true;
    }
    
    function showError(message) {
        // Remove any existing error message
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Create and display new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        inputFieldsContainer.appendChild(errorDiv);
    }
});

function showErrorWindow(message) {
    const modal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const okBtn = document.getElementById('errorOkBtn');
    
    errorMessage.textContent = message;
    modal.style.display = 'block';
    
    okBtn.onclick = function() {
      modal.style.display = 'none';
    }
    
    // Close when clicking outside the modal
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    }
}