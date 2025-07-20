export const mockMessages = [
	{
		role: "user",
		content: "Can you explain quantum computing basics?",
	},
	{
		role: "assistant",
		content: `Here's a brief introduction to quantum computing:

# Quantum Computing Basics

Quantum computing harnesses quantum mechanics to process information in fundamentally new ways. Here are the key concepts:

## Qubits
Unlike classical bits (0 or 1), quantum bits or **qubits** can exist in multiple states simultaneously through *superposition*.

## Key Features
1. Superposition
2. Entanglement
3. Quantum Gates

\`\`\`python
# Example of quantum circuit
def create_bell_state():
    qc = QuantumCircuit(2)
    qc.h(0)
    qc.cx(0, 1)
    return qc
\`\`\`

For more information, check out [IBM Quantum](https://quantum-computing.ibm.com/).`,
	},
	{
		role: "user",
		content:
			"That's interesting! Can you explain superposition in more detail?",
	},
	{
		role: "assistant",
		content: `## Understanding Superposition

Superposition is one of the most fascinating aspects of quantum mechanics. Here's what it means:

- A qubit can be in state |0⟩, state |1⟩, or **any quantum superposition** of these states
- The mathematical representation looks like: α|0⟩ + β|1⟩
- When measured, it "collapses" to either 0 or 1

### Practical Applications:
1. Quantum Search Algorithms
2. Quantum Cryptography
3. Quantum Simulation

> This property allows quantum computers to process vast amounts of information simultaneously.

![Superposition visualization](https://example.com/superposition.png)`,
	},
];
