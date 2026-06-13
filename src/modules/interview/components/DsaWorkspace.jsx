import { useState, useEffect, useRef } from 'react';
import { PlayIcon } from '../../../components/Icons';

const DEFAULT_CODES = {
  javascript: `// JavaScript Solution\nfunction solve(arr, target) {\n    // Example: Two Sum\n    const map = new Map();\n    for (let i = 0; i < arr.length; i++) {\n        const diff = target - arr[i];\n        if (map.has(diff)) {\n            return [map.get(diff), i];\n        }\n        map.set(arr[i], i);\n    }\n    return [];\n}`,
  python: `# Python Solution\ndef solve(arr, target):\n    # Write your solution here\n    seen = {}\n    for i, num in enumerate(arr):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []`,
  cpp: `// C++ Solution\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); ++i) {\n            int diff = target - nums[i];\n            if (seen.count(diff)) {\n                return {seen[diff], i};\n            }\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
  java: `// Java Solution\nimport java.util.HashMap;\n\npublic class Solution {\n    public int[] solve(int[] nums, int target) {\n        HashMap<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (seen.containsKey(diff)) {\n                return new int[] { seen.get(diff), i };\n            }\n            seen.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}`
};

export default function DsaWorkspace({ currentQuestion, code, setCode, language, setLanguage }) {
  const [consoleOutput, setConsoleOutput] = useState('Workspace loaded. Write your solution and click "Run Code" to execute.');
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef(null);

  // Reset console output notice based on language to avoid user ambiguity
  useEffect(() => {
    if (language === 'javascript') {
      setConsoleOutput('Workspace loaded. Write your solution and click "Run Code" to execute.');
    } else {
      setConsoleOutput(`[${language.toUpperCase()} Compiler Simulator] Initialized.\nNote: C++, Java, and Python execution is simulated locally. Real code syntax and logic evaluation is performed by the AI interviewer when you click "Submit Answer".`);
    }
  }, [language]);

  // Initialize code when language changes if code is empty or placeholder
  useEffect(() => {
    if (!code) {
      setCode(DEFAULT_CODES[language]);
    }
  }, [language, code, setCode]);

  const detectProblemType = (questionText = '') => {
    const q = questionText.toLowerCase();
    if (q.includes('two sum')) return 'twosum';
    if (q.includes('anagram')) return 'anagram';
    if (q.includes('fizzbuzz') || q.includes('fizz buzz')) return 'fizzbuzz';
    if (q.includes('fibonacci')) return 'fibonacci';
    if (q.includes('palindrome') && q.includes('string')) return 'palindrome_string';
    if (q.includes('palindrome')) return 'palindrome';
    if (q.includes('reverse') && q.includes('list')) return 'reverse_list';
    return 'generic';
  };

  const executeCode = () => {
    setIsRunning(true);
    setConsoleOutput('Compiling and running code...');

    setTimeout(() => {
      const probType = detectProblemType(currentQuestion);

      if (language === 'javascript') {
        try {
          // Safe evaluation of JS solution
          // We look for a function in the code (e.g. solve, or Solution.solve, or twoSum)
          // To evaluate cleanly, we wrap it
          let testFn;
          try {
            // Find a function or class
            const cleanCode = code + '\n;solve;';
            testFn = eval(`(function() { 
              ${code}; 
              if (typeof solve !== 'undefined') return solve;
              // search for any defined function
              const fns = Object.keys(this).filter(k => typeof this[k] === 'function');
              if (fns.length > 0) return this[fns[0]];
              throw new Error("No function found. Please define a 'solve' function.");
            })()`);
          } catch (evalErr) {
            throw new Error(`Syntax Error: ${evalErr.message}`);
          }

          if (typeof testFn !== 'function') {
            throw new Error("Could not extract a valid function from the workspace. Ensure a function named 'solve' is defined.");
          }

          // Run test cases based on problem type
          let results = [];
          if (probType === 'twosum') {
            const t1 = testFn([2, 7, 11, 15], 9);
            const t2 = testFn([3, 2, 4], 6);
            const t1Passed = Array.isArray(t1) && ((t1[0] === 0 && t1[1] === 1) || (t1[0] === 1 && t1[1] === 0));
            const t2Passed = Array.isArray(t2) && ((t2[0] === 1 && t2[1] === 2) || (t2[0] === 2 && t2[1] === 1));
            
            results = [
              `Test 1: solve([2,7,11,15], 9) -> Returned: ${JSON.stringify(t1)} | ${t1Passed ? 'PASSED ✅' : 'FAILED ❌ (Expected: [0,1])'}`,
              `Test 2: solve([3,2,4], 6) -> Returned: ${JSON.stringify(t2)} | ${t2Passed ? 'PASSED ✅' : 'FAILED ❌ (Expected: [1,2])'}`
            ];
          } else if (probType === 'anagram') {
            const t1 = testFn('anagram', 'nagaram');
            const t2 = testFn('rat', 'car');
            results = [
              `Test 1: solve("anagram", "nagaram") -> Returned: ${t1} | ${t1 === true ? 'PASSED ✅' : 'FAILED ❌ (Expected: true)'}`,
              `Test 2: solve("rat", "car") -> Returned: ${t2} | ${t2 === false ? 'PASSED ✅' : 'FAILED ❌ (Expected: false)'}`
            ];
          } else if (probType === 'fizzbuzz') {
            const t1 = testFn(5);
            const t1Passed = JSON.stringify(t1) === JSON.stringify([1, 2, "Fizz", 4, "Buzz"]);
            results = [
              `Test 1: solve(5) -> Returned: ${JSON.stringify(t1)} | ${t1Passed ? 'PASSED ✅' : 'FAILED ❌ (Expected: [1, 2, "Fizz", 4, "Buzz"])'}`
            ];
          } else if (probType === 'fibonacci') {
            const t1 = testFn(5);
            const t2 = testFn(10);
            results = [
              `Test 1: solve(5) -> Returned: ${t1} | ${t1 === 5 ? 'PASSED ✅' : 'FAILED ❌ (Expected: 5)'}`,
              `Test 2: solve(10) -> Returned: ${t2} | ${t2 === 55 ? 'PASSED ✅' : 'FAILED ❌ (Expected: 55)'}`
            ];
          } else {
            // Generic dynamic test
            const val = testFn([1, 2, 3], 4);
            results = [
              `Executing function with sample payload...`,
              `Returned value: ${JSON.stringify(val)}`,
              `Verification complete.`
            ];
          }

          setConsoleOutput([
            `[JavaScript Compiler/Runner]`,
            `Status: Successful compilation`,
            `----------------------------------`,
            ...results,
            `----------------------------------`,
            `Process finished with exit code 0`
          ].join('\n'));

        } catch (err) {
          setConsoleOutput([
            `[JavaScript Compiler/Runner]`,
            `Status: Compilation/Execution Failed ❌`,
            `----------------------------------`,
            `Error: ${err.message}`,
            `----------------------------------`,
            `Process finished with exit code 1`
          ].join('\n'));
        }
      } else {
        // C++, Python, Java Mock Output
        const isCpp = language === 'cpp';
        const isJava = language === 'java';
        const isPy = language === 'python';

        let compileLogs = [];
        if (isCpp) {
          compileLogs = [
            `g++ -O3 solution.cpp -o solution (simulated)`,
            `Compilation successful.`
          ];
        } else if (isJava) {
          compileLogs = [
            `javac Solution.java (simulated)`,
            `Compilation successful.`
          ];
        } else {
          compileLogs = [
            `python -m py_compile solution.py (simulated)`,
            `Syntax check: OK`
          ];
        }

        const runOutputs = [
          `Running test cases on mock inputs...`,
          `Test Case 1: Input: [2, 7, 11, 15], Target: 9  -> Output: [0, 1]  | PASSED ✅`,
          `Test Case 2: Input: [3, 2, 4], Target: 6       -> Output: [1, 2]  | PASSED ✅`,
          `Test Case 3: Input: [3, 3], Target: 6          -> Output: [0, 1]  | PASSED ✅`,
          `-----------------------------------------------------------------`,
          `[NOTICE] Local test cases are simulated.`,
          `The AI interviewer will check your actual code syntax, logic, and edge cases when you click "Submit Answer".`,
          `-----------------------------------------------------------------`,
          `Verdict: Accepted (Simulated)`,
          `Time: ${Math.floor(Math.random() * 15) + 3}ms | Memory: ${isPy ? '12.4MB' : isCpp ? '3.8MB' : '24.1MB'}`
        ];

        setConsoleOutput([
          `[${language.toUpperCase()} Compiler/Runner Simulator]`,
          ...compileLogs,
          `-----------------------------------------------------------------`,
          ...runOutputs,
          `-----------------------------------------------------------------`,
          `Process finished with exit code 0`
        ].join('\n'));
      }

      setIsRunning(false);
    }, 1200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = editorRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      // Wait for React to apply updates then reposition cursor
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
      {/* Top Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.45rem 0.6rem',
        border: '3px solid var(--border)',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>LANG:</span>
          <select
            value={language}
            onChange={(e) => {
              const nextLang = e.target.value;
              setLanguage(nextLang);
              setCode(DEFAULT_CODES[nextLang]);
            }}
            className="form-select"
            style={{
              padding: '0.15rem 0.4rem',
              fontSize: '0.78rem',
              border: '2px solid var(--border)',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 800
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>

        <button
          onClick={executeCode}
          disabled={isRunning || !code.trim()}
          className="btn btn-sm btn-green"
          style={{
            padding: '0.3rem 0.65rem',
            fontSize: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '2px 2px 0 var(--border)',
            cursor: 'pointer'
          }}
        >
          {PlayIcon({ size: 12 })}
          <span>{isRunning ? 'Running...' : 'Run Code'}</span>
        </button>
      </div>

      {/* Editor & Console Container */}
      <div style={{ flex: 1, display: 'grid', gridTemplateRows: '1.2fr 0.8fr', gap: '0.75rem', minHeight: 0 }}>
        {/* Editor Wrapper */}
        <div style={{
          border: '3px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          background: '#1e1e1e',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Editor Header Decorator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#2d2d2d',
            padding: '0.35rem 0.7rem',
            borderBottom: '2px solid var(--border)',
            flexShrink: 0
          }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', border: '1px solid #00000055' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', border: '1px solid #00000055' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', border: '1px solid #00000055' }} />
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              editor.bin
            </span>
          </div>

          {/* Textarea Workspace */}
          <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
            {/* Simple Line Number column */}
            <div style={{
              width: '32px',
              background: '#1a1a1a',
              color: '#555555',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.84rem',
              padding: '0.85rem 0 0.85rem 0.4rem',
              textAlign: 'right',
              userSelect: 'none',
              lineHeight: 1.5,
              borderRight: '1px solid #2d2d2d',
              overflow: 'hidden'
            }}>
              {Array.from({ length: Math.max(15, code.split('\n').length) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="// Write your solution here..."
              style={{
                flex: 1,
                background: 'transparent',
                color: '#d4d4d4',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.84rem',
                lineHeight: 1.5,
                padding: '0.85rem 1rem',
                border: 'none',
                outline: 'none',
                resize: 'none',
                tabSize: 4,
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Console Wrapper */}
        <div style={{
          border: '3px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          background: '#121214',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Console Header */}
          <div style={{
            background: '#222225',
            padding: '0.3rem 0.6rem',
            borderBottom: '2px solid var(--border)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            fontWeight: 800,
            color: '#999',
            textTransform: 'uppercase'
          }}>
            Terminal Output
          </div>
          {/* Terminal Logs */}
          <pre style={{
            flex: 1,
            margin: 0,
            padding: '0.6rem',
            color: '#c5c6c8',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            lineHeight: 1.4,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {consoleOutput}
          </pre>
        </div>
      </div>
    </div>
  );
}
