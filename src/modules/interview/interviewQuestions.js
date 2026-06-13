export const QUESTIONS_DATA = {
  cpp: {
    title: 'C++ Programming',
    description: 'Master core C++ concepts, memory models, object-oriented semantics, and resource management.',
    icon: 'CPP',
    accentColor: 'var(--blue)',
    resources: [
      { name: 'Kunal Kushwaha C++ Playlist', url: 'https://www.youtube.com/@KunalKushwaha' },
      { name: 'Corey Schafer C++ Tutorials', url: 'https://www.youtube.com/@coreyms' },
      { name: 'Coding with John', url: 'https://www.youtube.com/@CodingWithJohn' },
      { name: 'Java Brains (Low Level)', url: 'https://www.youtube.com/@JavaBrains' }
    ],
    questions: [
      {
        id: 'stack-heap',
        q: 'Stack vs Heap Memory',
        visualId: 'stack-heap',
        ans: `### Stack vs Heap Memory in C++

C++ uses two distinct areas of RAM for memory allocation:

| Property | Stack Memory | Heap Memory |
| :--- | :--- | :--- |
| **Allocation** | Managed automatically by the CPU. Linear structure. | Managed manually by the programmer (or smart pointers). |
| **Speed** | Very fast (simple pointer movement). | Slower (requires finding free memory blocks, fragmentation). |
| **Size Limit** | Small (typically 1MB - 8MB default size limits). | Very large (limited only by system's virtual memory). |
| **Lifetime** | Tied to block scope (automatically deallocated on return). | Dynamic (persists until explicitly deleted). |

#### Stack Example:
\`\`\`cpp
void myFunction() {
    int x = 10; // Allocated on the stack
} // x is popped and destroyed automatically here
\`\`\`

#### Heap Example:
\`\`\`cpp
void myFunction() {
    int* p = new int(10); // 'p' is on stack, points to '10' on the heap
    delete p; // Explicitly freed to avoid memory leaks
}
\`\`\``
      },
      {
        id: 'polymorphism',
        q: 'Difference between compile-time and runtime polymorphism',
        visualId: 'polymorphism',
        ans: `### Compile-time vs Runtime Polymorphism

Polymorphism allows objects of different classes to respond to the same function call.

#### 1. Compile-Time Polymorphism (Static Binding)
- Resolved during compilation.
- Achieved via **Method Overloading** and **Operator Overloading**.
- Fast execution since binding happens early.

\`\`\`cpp
class Calculator {
public:
    int add(int a, int b) { return a + b; }
    double add(double a, double b) { return a + b; } // Overloaded
};
\`\`\`

#### 2. Runtime Polymorphism (Dynamic Binding)
- Resolved during program execution.
- Achieved via **Function Overriding** using \`virtual\` functions.
- Incur a slight performance penalty due to vtable lookup (see Virtual Functions).

\`\`\`cpp
class Base {
public:
    virtual void show() { cout << "Base class"; }
};
class Derived : public Base {
public:
    void show() override { cout << "Derived class"; } // Overridden
};
\`\`\``
      },
      {
        id: 'compilation-steps',
        q: 'What happens during compilation in C++?',
        visualId: 'compilation-steps',
        ans: `### C++ Compilation Process

Converting a human-readable \`.cpp\` file into a machine-readable executable occurs in 4 distinct phases:

1. **Preprocessing (#include, #define):**
   - Resolves preprocessor directives.
   - Replaces macros and copies headers (\`.h\` files) into source files.
   - Generates translation units (\`.i\` files).
2. **Compilation (Source Code to Assembly):**
   - Syntactically validates code and compiles it into assembly language (\`.s\` files).
3. **Assembly (Assembly to Machine Code):**
   - The assembler translates assembly into binary object code files (\`.o\` or \`.obj\` files).
4. **Linking (Combining Objects & Libraries):**
   - The linker merges object files and static library binaries.
   - Resolves external references and produces the final binary executable (\`.exe\` or \`a.out\`).`
      },
      {
        id: 'vtable',
        q: 'What is a virtual function and how does the vtable work?',
        visualId: 'vtable',
        ans: `### Virtual Functions & The Virtual Table (Vtable)

A \`virtual\` function tells the C++ compiler to defer binding to runtime.

#### How it Works Internally:
- **vtable (Virtual Table):** A static table created for every class that declares or overrides virtual functions. It is an array of function pointers pointing to the most derived versions of the virtual functions.
- **vptr (Virtual Pointer):** Every object of a class with virtual functions contains a hidden pointer (usually at the start of the object) pointing to its class's vtable.

#### Invocation Steps:
1. When calling \`basePtr->virtualFunc()\`, the compiler follows \`basePtr\` to the object.
2. It fetches the \`vptr\` from the object.
3. It indexes the corresponding vtable to find the target function pointer.
4. It calls the function dynamically.

\`\`\`cpp
class Animal {
public:
    virtual void makeSound() { cout << "Some sound"; }
};
class Dog : public Animal {
public:
    void makeSound() override { cout << "Bark"; }
};
\`\`\``
      },
      {
        id: 'shallow-deep-copy',
        q: 'Difference between shallow copy and deep copy',
        visualId: 'shallow-deep-copy',
        ans: `### Shallow Copy vs Deep Copy

How objects containing dynamically allocated memory pointers are duplicated.

#### Shallow Copy
- Copies all member variables directly, including pointers.
- Both the original and copied object point to the **same heap memory location**.
- **Danger:** Modifying one affects the other, and deleting one leads to "double-free" crashes when the other is destroyed.
- Default behavior of C++'s built-in assignment operator and copy constructor.

#### Deep Copy
- Allocates new memory on the heap for the copied object.
- Copies the actual value pointed to, not just the pointer address.
- Both objects maintain **independent** memory allocations.

\`\`\`cpp
class Box {
    int* data;
public:
    // Shallow Copy Constructor
    // Box(const Box& other) : data(other.data) {}

    // Deep Copy Constructor
    Box(const Box& other) {
        data = new int(*other.data); // Separate memory allocation
    }
    ~Box() { delete data; }
};
\`\`\``
      },
      {
        id: 'copy-move-constructor',
        q: 'Copy constructor vs move constructor',
        visualId: 'copy-move-constructor',
        ans: `### Copy Constructor vs Move Constructor

C++11 introduced move semantics to optimize performance by avoiding expensive deep copies for temporary objects.

#### Copy Constructor
- Creates a copy of an existing object.
- Parameters are passed by const reference: \`Class(const Class& other)\`.
- Allocates new resources (deep copy) leaving the original object unchanged.

#### Move Constructor
- Transfers ownership of resources from a temporary (rvalue) object directly.
- Parameters are passed by rvalue reference: \`Class(Class&& other) noexcept\`.
- Steals pointers and sets the temporary object's pointers to \`nullptr\` (very fast, zero allocation).

\`\`\`cpp
class Buffer {
    int* data;
    int size;
public:
    // Copy Constructor
    Buffer(const Buffer& other) : size(other.size) {
        data = new int[size];
        std::copy(other.data, other.data + size, data);
    }
    // Move Constructor
    Buffer(Buffer&& other) noexcept : data(other.data), size(other.size) {
        other.data = nullptr; // Null out resource in source
        other.size = 0;
    }
};
\`\`\``
      },
      {
        id: 'smart-pointers',
        q: 'What are smart pointers and why are they needed?',
        visualId: 'smart-pointers',
        ans: `### Smart Pointers in C++ (\`<memory>\`)

Raw pointers require manual \`delete\` calls, creating major risks for memory leaks and dangling pointers. Smart pointers wrap raw pointers and automate cleanup using **RAII (Resource Acquisition Is Initialization)**.

#### 1. \`std::unique_ptr\`
- **Exclusive ownership:** Sole owner of the allocated heap object.
- Cannot be copied; must be **moved** (\`std::move\`).
- Automatically deletes memory when out of scope.

#### 2. \`std::shared_ptr\`
- **Shared ownership:** Multiple shared pointers can point to the same resource.
- Maintains a **reference counter**. When counter reaches 0, the resource is deleted.

#### 3. \`std::weak_ptr\`
- Non-owning reference. Points to a \`shared_ptr\` resource without incrementing reference counter.
- Used to break circular dependencies that cause memory leaks.

\`\`\`cpp
#include <memory>
void demo() {
    std::unique_ptr<int> uptr = std::make_unique<int>(100);
    std::shared_ptr<int> sptr1 = std::make_shared<int>(200);
    std::shared_ptr<int> sptr2 = sptr1; // Ref count = 2
}
\`\`\``
      },
      {
        id: 'process-thread',
        q: 'Difference between process and thread',
        visualId: 'process-thread',
        ans: `### Process vs Thread

Fundamentals of system execution units:

| Feature | Process | Thread |
| :--- | :--- | :--- |
| **Definition** | An executing instance of a program (heavyweight). | A path of execution inside a process (lightweight). |
| **Address Space** | Owns its own independent address space and descriptors. | Shares memory and resources of its parent process. |
| **Communication** | Inter-Process Communication (IPC): pipes, sockets, IPC. | Direct access to shared process variables (needs lock). |
| **Overhead** | High context switching overhead. | Low context switching overhead. |
| **Safety** | High. One process crashing does not affect others. | Low. A thread crash can crash the entire parent process. |

- In C++11, multi-threading is natively supported via \`#include <thread>\`.`
      },
      {
        id: 'memory-leaks-segfaults',
        q: 'What causes memory leaks and segmentation faults?',
        visualId: 'memory-leaks-segfaults',
        ans: `### Memory Leaks & Segmentation Faults in C++

Understanding the two most common memory-related runtime errors in C++:

#### 1. Memory Leaks
- **Cause:** Heap memory is allocated using \`new\` or \`malloc\` but never deallocated via \`delete\` or \`free\`.
- **Consequence:** Slowly consumes system RAM, eventually causing the program or system to crash.
- **Prevention:** Use smart pointers, RAII patterns, and tools like Valgrind.

\`\`\`cpp
void leak() {
    int* val = new int(5);
    // Forgot delete val! Memory is leaked on exit.
}
\`\`\`

#### 2. Segmentation Fault (Segfault)
- **Cause:** The program attempts to access an invalid or restricted memory address (hardware-level protection violation).
- **Triggers:**
  - Dereferencing a \`nullptr\` or wild pointer.
  - Writing past array boundaries (Buffer Overflow).
  - Stack overflow (e.g., infinite recursion).
  - Writing to read-only string literals.

\`\`\`cpp
void crash() {
    int* ptr = nullptr;
    *ptr = 10; // Segfault: dereferencing nullptr
}
\`\`\``
      },
      {
        id: 'malloc-new',
        q: 'Difference between malloc/free and new/delete',
        visualId: 'malloc-new',
        ans: `### malloc/free vs new/delete

| Feature | \`malloc\` / \`free\` | \`new\` / \`delete\` |
| :--- | :--- | :--- |
| **Origin** | C Standard Library functions (\`<cstdlib>\`). | C++ built-in operators. |
| **Constructors** | Does **not** call object constructors. | Calls object constructors automatically. |
| **Return Type** | Returns a \`void*\` (requires explicit casting). | Returns a typed pointer (no cast needed). |
| **Memory Size** | Must specify allocation size in bytes explicitly. | Size is calculated automatically by compiler. |
| **Failure Mode** | Returns \`NULL\` on failure. | Throws a \`std::bad_alloc\` exception. |

#### C Style:
\`\`\`cpp
Foo* f = (Foo*)malloc(sizeof(Foo)); // Constructor is NOT called!
free(f);
\`\`\`

#### C++ Style:
\`\`\`cpp
Foo* f = new Foo(); // Constructor is called!
delete f; // Destructor is called
\`\`\``
      }
    ]
  },
  java: {
    title: 'Java Programming',
    description: 'Understand the JVM internals, memory management, garbage collection, and concurrency.',
    icon: 'JAVA',
    accentColor: 'var(--orange)',
    resources: [
      { name: 'Java Brains Channel', url: 'https://www.youtube.com/@JavaBrains' },
      { name: 'Coding with John (Java)', url: 'https://www.youtube.com/@CodingWithJohn' },
      { name: 'Kunal Kushwaha Java Fundamentals', url: 'https://www.youtube.com/@KunalKushwaha' }
    ],
    questions: [
      {
        id: 'jdk-jre-jvm',
        q: 'Difference between JDK, JRE, and JVM',
        visualId: 'jdk-jre-jvm',
        ans: `### JDK vs JRE vs JVM in Java

Java's runtime ecosystem is structured in layers, each serving a specific developer or user need:

#### 1. JVM (Java Virtual Machine)
- The core interpreter engine.
- Loads, verifies, and executes compiled bytecode (\`.class\` files).
- Platform-dependent (different JVM binaries exist for Windows, Mac, Linux).

#### 2. JRE (Java Runtime Environment)
- Encloses JVM + Java Core Libraries (e.g. \`rt.jar\`, util tools).
- Provides the execution environment needed to *run* Java applications.
- Cannot compile Java source code.

#### 3. JDK (Java Development Kit)
- Full-featured SDK for developers.
- Encloses JRE + Development Tools like the Java compiler (\`javac\`), debugger (\`jdb\`), and archive tools (\`jar\`).`
      },
      {
        id: 'platform-independence',
        q: 'How Java achieves platform independence',
        visualId: 'platform-independence',
        ans: `### Platform Independence in Java

"Write Once, Run Anywhere" (WORA) is Java's defining feature. It is achieved through a two-step compile-and-execute process:

1. **Compilation to Bytecode:**
   - Instead of compiling Java code directly into machine-native binaries, the compiler (\`javac\`) translates it into intermediate **Bytecode** (\`.class\` files).
   - This bytecode is a highly optimized set of instructions designed for the Java Virtual Machine.

2. **JVM Translation:**
   - Any machine with a Java Virtual Machine (JVM) installed can execute this bytecode.
   - The JVM interprets the bytecode (or compiles it to native machine instructions at runtime using the **JIT Compiler**) on the fly.
   - While the JVM itself is platform-dependent, the bytecode it executes is completely platform-independent.`
      },
      {
        id: 'jvm-memory',
        q: 'Heap vs Stack memory in JVM',
        visualId: 'jvm-memory',
        ans: `### Heap vs Stack Memory in JVM

| Property | Stack Memory | Heap Memory |
| :--- | :--- | :--- |
| **Storage** | Local variables, primitive data, and reference variables (holding addresses of heap objects). | All instances of classes, array structures, and objects. |
| **Thread Scope** | Thread-private (each thread has its own Stack). | Shared across all application threads. |
| **Errors** | Throws \`java.lang.StackOverflowError\`. | Throws \`java.lang.OutOfMemoryError\`. |
| **Allocation** | Last In First Out (LIFO) model. | Dynamic layout with generations (Young, Old). |

#### Stack and Heap Interaction:
\`\`\`java
public class Demo {
    public static void main(String[] args) {
        int x = 10; // Primitive 'x' sits in main thread's Stack frame
        String s = new String("Hello"); // 's' reference is on Stack, "Hello" object sits in Heap
    }
}
\`\`\``
      },
      {
        id: 'gc-jvm',
        q: 'How Garbage Collection works in Java',
        visualId: 'gc-jvm',
        ans: `### Java Garbage Collection (GC)

Java automates heap management using Garbage Collection. GC detects and deletes unreachable objects to reclaim heap space.

#### 1. Reachability
- An object is eligible for GC if it has no active references pointing to it from Stack frames, static variables, or JNI registers.

#### 2. Generational Heap Layout
- **Young Generation (Eden, S0, S1):** New objects are created here. Most objects die young. Minor GC runs here.
- **Old (Tenured) Generation:** Objects surviving multiple Young GCs are promoted here. Major GC runs here (slower).
- **Permanent Generation (Metaspace in Java 8+):** Stores class metadata, method descriptions, and constant pools.

#### 3. Common Garbage Collectors
- **G1 (Garbage First):** Splits heap into regions and sweeps regions with the most garbage first. Standard in modern JDKs.
- **ZGC:** Ultra-low latency garbage collector.`
      },
      {
        id: 'equals-operator',
        q: 'Difference between == and equals()',
        visualId: 'equals-operator',
        ans: `### Difference between == and equals() in Java

Comparing objects in Java:

#### 1. The \`==\` Operator
- Compares **references (memory addresses)** for object variables.
- Compares **values** for primitives (e.g. \`5 == 5\`).
- Returns \`true\` only if both variables point to the exact same object in heap.

#### 2. The \`equals()\` Method
- A method defined in the \`Object\` class.
- Intended to compare **content equality (logical state)**.
- Default implementation in \`Object\` class is \`==\`. Classes must override it (e.g. \`String\`, \`Integer\`) to compare actual value contents.

\`\`\`java
String s1 = new String("Java");
String s2 = new String("Java");

System.out.println(s1 == s2);      // false (different heap allocations)
System.out.println(s1.equals(s2)); // true (same character contents)
\`\`\``
      },
      {
        id: 'hashmap-concurrenthashmap',
        q: 'Difference between HashMap and ConcurrentHashMap',
        visualId: 'hashmap-concurrenthashmap',
        ans: `### HashMap vs ConcurrentHashMap

Comparing key-value data structures:

| Feature | HashMap | ConcurrentHashMap |
| :--- | :--- | :--- |
| **Thread Safety** | **Not thread-safe**. Concurrent edits can corrupt internal state. | **Thread-safe**. Fully optimized for concurrent reading and writing. |
| **Locking Mechanism** | None. | **Bucket-level locking** (Segmented locks in Java 7; CAS and Node locks in Java 8+). |
| **Performance** | Extremely fast in single-thread scenarios. | Slightly slower but scales exceptionally well under multi-thread loads. |
| **Null Keys/Values** | Allows one null key and multiple null values. | Does **not** allow null keys or null values. |

- **Hashtable** is also thread-safe, but it locks the entire table for every read/write, making it slow compared to \`ConcurrentHashMap\`.`
      },
      {
        id: 'java-process-thread',
        q: 'Process vs Thread in Java',
        visualId: 'java-process-thread',
        ans: `### Process vs Thread in Java

In Java, concurrency revolves around the \`Thread\` class.

#### Process
- A separate program running with its own memory boundary (managed by the OS).
- You can spawn native processes in Java using \`ProcessBuilder\`.

#### Thread
- A lightweight path of execution inside the Java application.
- All threads spawned within a JVM share the same **JVM Heap** but possess their own private **Call Stack** and **Program Counter (PC) Register**.

\`\`\`java
class MyThread extends Thread {
    public void run() {
        System.out.println("Running inside a thread!");
    }
}
// Running it:
new MyThread().start();
\`\`\``
      },
      {
        id: 'sync-deadlock',
        q: 'What is synchronization and deadlock?',
        visualId: 'sync-deadlock',
        ans: `### Synchronization & Deadlocks in Java

#### 1. Synchronization
- Used to protect shared resources from race conditions when multiple threads access them concurrently.
- Achieved using the \`synchronized\` keyword or custom \`Lock\` classes.
- Locks the monitor/mutex of an object.

\`\`\`java
public synchronized void increment() {
    count++; // Only one thread can execute this at a time
}
\`\`\`

#### 2. Deadlock
- A condition where two or more threads are blocked forever, waiting for locks held by each other.
- **Example Scenario:**
  - Thread 1 locks Resource A and waits for Resource B.
  - Thread 2 locks Resource B and waits for Resource A.
- **Prevention:** Always acquire locks in a consistent order, use timeout locks (\`tryLock()\`), or avoid nesting locks.`
      },
      {
        id: 'java-internal-execution',
        q: 'What happens when a Java program runs internally?',
        visualId: 'java-internal-execution',
        ans: `### Java Internal Execution Lifecycle

How code flows from source files to execution:

1. **Compilation (\`javac\`):**
   - Developer compiles \`Program.java\` into bytecode \`Program.class\`.
2. **Class Loading:**
   - The JVM's **ClassLoader** loads the bytecode into the JVM's Runtime Data Areas (Method Area).
3. **Bytecode Verification:**
   - Validates that bytecode is safe to run and doesn't violate JVM security rules.
4. **Execution Engine:**
   - **Interpreter:** Reads and executes bytecode instructions one by one.
   - **JIT (Just-In-Time) Compiler:** Monitors code. Compiles frequently executed "hot" bytecode fragments into native machine code for direct CPU execution, boosting performance.
   - **Garbage Collector:** Automatically cleans up dereferenced heap memory.`
      },
      {
        id: 'string-builder-buffer',
        q: 'Difference between String, StringBuilder, and StringBuffer',
        visualId: 'string-builder-buffer',
        ans: `### String vs StringBuilder vs StringBuffer

| Feature | String | StringBuilder | StringBuffer |
| :--- | :--- | :--- | :--- |
| **Mutability** | **Immutable**. String modification spawns a new object. | **Mutable**. Modified in-place. | **Mutable**. Modified in-place. |
| **Thread Safety** | Thread-safe (due to immutability). | **Not thread-safe**. | **Thread-safe** (synchronized methods). |
| **Performance** | Slower when performing frequent concatenations. | **Fastest** (no synchronization overhead). | Slower than \`StringBuilder\` due to locking. |

#### Code Comparison:
\`\`\`java
String s = "Hello";
s += " World"; // Spawns a new String object!

StringBuilder sb = new StringBuilder("Hello");
sb.append(" World"); // Modifies existing buffer (fast)
\`\`\``
      }
    ]
  },
  python: {
    title: 'Python Programming',
    description: 'Learn execution phases, mutable object behaviors, generator efficiency, and the GIL.',
    icon: 'PYTHON',
    accentColor: 'var(--yellow)',
    resources: [
      { name: 'Corey Schafer Python Playlist', url: 'https://www.youtube.com/@coreyms' },
      { name: 'Kunal Kushwaha (Python Concepts)', url: 'https://www.youtube.com/@KunalKushwaha' },
      { name: 'Java Brains (Python Series)', url: 'https://www.youtube.com/@JavaBrains' }
    ],
    questions: [
      {
        id: 'gil',
        q: 'What is GIL (Global Interpreter Lock)?',
        visualId: 'gil',
        ans: `### Global Interpreter Lock (GIL) in Python

The **GIL** is a mutex (lock) in the standard CPython implementation that ensures **only one thread executes Python bytecode at a time**.

#### Why does the GIL exist?
- CPython's memory management is not thread-safe.
- The GIL prevents race conditions on Python's internal reference counting variables.
- It makes single-threaded code run very quickly and simplifies integration with C libraries.

#### Impact on Performance:
- **CPU-Bound Tasks (e.g. loops, math):** Multithreading **will not speed up** performance because threads must wait to acquire the GIL. Use the \`multiprocessing\` module instead.
- **I/O-Bound Tasks (e.g. disk read, API requests):** Multithreading **is effective** because a thread releases the GIL while waiting for I/O.

\`\`\`python
# GIL makes this run sequentially even with 2 threads:
import threading
def count_up():
    x = 0
    while x < 10000000: x += 1

t1 = threading.Thread(target=count_up)
t2 = threading.Thread(target=count_up)
# Spawning them won't utilize multiple CPU cores.
\`\`\``
      },
      {
        id: 'thread-multiprocessing-py',
        q: 'Difference between multithreading and multiprocessing',
        visualId: 'thread-multiprocessing-py',
        ans: `### Multithreading vs Multiprocessing in Python

Due to the Global Interpreter Lock (GIL), concurrency models behave differently in Python:

#### 1. Multithreading (\`threading\` module)
- Multiple threads share a single process memory boundary.
- **GIL Limit:** Only one thread executes Python code at a time.
- Best for **I/O-bound tasks** (network calls, downloading images, file reading).

#### 2. Multiprocessing (\`multiprocessing\` module)
- Spawns entirely separate Python interpreter processes, each with its own memory and its own GIL.
- Utilizes multiple CPU cores simultaneously.
- Higher memory footprint (process creation overhead).
- Best for **CPU-bound tasks** (data analysis, image processing, heavy math).`
      },
      {
        id: 'mutable-immutable',
        q: 'Mutable vs Immutable objects',
        visualId: 'mutable-immutable',
        ans: `### Mutable vs Immutable Objects in Python

Everything in Python is an object. An object's mutability determines whether its value can be changed in-place.

#### 1. Mutable Objects
- Can be modified after creation.
- Operations modify the object **at the same memory address**.
- **Examples:** \`list\`, \`dict\`, \`set\`, custom classes.

\`\`\`python
my_list = [1, 2]
my_list.append(3) # my_list remains at same id(my_list)
\`\`\`

#### 2. Immutable Objects
- Cannot be modified after creation.
- Operations that appear to modify them actually spawn a **new object** at a different memory address.
- **Examples:** \`int\`, \`float\`, \`string\`, \`tuple\`, \`frozenset\`.

\`\`\`python
text = "Hello"
text += " World" # Spawns a brand new string! 'Hello' is garbage collected.
\`\`\``
      },
      {
        id: 'is-equals-py',
        q: 'Difference between is and ==',
        visualId: 'is-equals-py',
        ans: `### Difference between is and == in Python

Comparing objects in Python:

#### 1. The \`==\` Operator
- Compares **values / data equality**.
- Returns \`True\` if the contents of two objects are identical.

#### 2. The \`is\` Operator
- Compares **identity (memory addresses)**.
- Returns \`True\` only if both variables point to the exact same object in RAM (i.e. \`id(a) == id(b)\`).

\`\`\`python
a = [1, 2, 3]
b = [1, 2, 3]

print(a == b) # True  (values are identical)
print(a is b) # False (different list objects in memory)

c = a
print(c is a) # True  (point to same memory address)
\`\`\``
      },
      {
        id: 'py-copying',
        q: 'Deep copy vs shallow copy',
        visualId: 'py-copying',
        ans: `### Deep Copy vs Shallow Copy in Python (\`copy\` module)

#### 1. Shallow Copy (\`copy.copy()\`)
- Spawns a new outer object, but inserts references to the child objects inside the original.
- If the object contains nested mutable elements (like a list inside a list), changes to the nested list affect **both** copies.

#### 2. Deep Copy (\`copy.deepcopy()\`)
- Spawns a new outer object and recursively duplicates all nested objects.
- Modifying nested objects in the copy has **no effect** on the original.

\`\`\`python
import copy
original = [[1, 2], [3, 4]]

# Shallow
s_copy = copy.copy(original)
s_copy[0][0] = 99
print(original[0][0]) # 99! (Nested elements are shared references)

# Deep
d_copy = copy.deepcopy(original)
d_copy[0][0] = 77
print(original[0][0]) # 99 (Original is isolated)
\`\`\``
      },
      {
        id: 'py-mem-management',
        q: 'How Python memory management works?',
        visualId: 'py-mem-management',
        ans: `### Python Memory Management

Python manages memory using three primary mechanisms:

1. **Private Heap:**
   - All Python objects and data structures are stored on a private heap. The programmer does not have direct access to this heap; it is managed by the Python memory manager.

2. **Reference Counting:**
   - Every object tracks how many references point to it.
   - When an object's reference count drops to **0**, Python immediately deallocates its memory.
   - Increment events: Assignment, passing to function, appending to list.

3. **Garbage Collector (for Cycles):**
   - Reference counting cannot resolve **circular references** (e.g. Object A points to Object B, and Object B points to Object A, but both are unreachable from the application).
   - Python's GC runs in the background, detecting cyclic graphs and sweeping them using a generational threshold algorithm.`
      },
      {
        id: 'py-execution-flow',
        q: 'What happens when Python code executes internally?',
        visualId: 'py-execution-flow',
        ans: `### Python Internal Execution Flow

Although Python is often called an interpreted language, it undergoes a compilation phase:

1. **Source Code to Bytecode:**
   - When you run \`python script.py\`, the compiler translates the source code into intermediate **Bytecode** instructions.
   - This bytecode is cached in \`__pycache__/\` as \`.pyc\` files to speed up subsequent executions.

2. **Virtual Machine Execution (PVM):**
   - The **Python Virtual Machine (PVM)** is a stack-based runtime interpreter.
   - It loops through the bytecode, translating instructions into machine-native CPU instructions on the fly and executing them.

- **Interpreter vs Compiler:** Python combines both. The compilation step is automatic and transparent, while the final execution is interpreted.`
      },
      {
        id: 'list-tuple',
        q: 'List vs Tuple',
        visualId: 'list-tuple',
        ans: `### List vs Tuple in Python

Comparing Python's sequence types:

| Feature | List | Tuple |
| :--- | :--- | :--- |
| **Mutability** | **Mutable** (values can change). | **Immutable** (cannot be altered). |
| **Syntax** | Brackets: \`[1, 2]\` | Parentheses: \`(1, 2)\` |
| **Size / Memory** | Larger memory size (pre-allocates extra space for growth). | Smaller memory footprint (allocated exactly). |
| **Use Case** | Storing homogeneous data that changes dynamically. | Heterogeneous data records (e.g. \`(lat, lon)\` coordinates). |
| **Performance** | Slower iteration and creation. | Faster execution (compiler optimizations). |

\`\`\`python
my_list = [1, 2, 3]
my_tuple = (1, 2, 3)
# my_tuple[0] = 99 -> Raises TypeError
\`\`\``
      },
      {
        id: 'generators',
        q: 'What are generators and why are they memory efficient?',
        visualId: 'generators',
        ans: `### Generators in Python

Generators are functions that return an **iterator** using the \`yield\` keyword, producing values on demand instead of computing them all at once.

#### Memory Efficiency:
- A standard function computes its return values and holds the entire list in memory.
- A generator produces values **one-at-a-time (lazy evaluation)**. It pauses its state until the next value is requested, using virtually zero memory even for infinite datasets.

#### Standard List:
\`\`\`python
def get_squares(n):
    return [i*i for i in range(n)] # Holds 'n' elements in RAM
\`\`\`

#### Generator:
\`\`\`python
def get_squares_gen(n):
    for i in range(n):
        yield i*i # Computes & yields one value at a time

for val in get_squares_gen(1000000):
    print(val) # Only one square integer exists in RAM at a time!
\`\`\``
      },
      {
        id: 'interpreter-compiler-py',
        q: 'Difference between interpreter and compiler in Python',
        visualId: 'interpreter-compiler-py',
        ans: `### Compiler vs Interpreter in Python

Python is a hybrid language that compiles source code to intermediate bytecode and then interprets that bytecode.

#### Compilers:
- Translate the **entire** source code into native machine code (binary) at once before execution.
- Produces fast binaries (e.g. C, C++, Rust).

#### Interpreters:
- Read and execute source code or bytecode line-by-line during runtime.
- Easier to debug and platform-independent, but slower execution.

- **CPython** compiles your script to bytecode (\`.pyc\`) first, then interprets it using the PVM loop.`
      }
    ]
  },
  puzzles: {
    title: 'Logical Puzzles',
    description: 'Solve famous analytical riddles, logic grids, and probability brainteasers frequently asked in interviews.',
    icon: 'PUZZLES',
    accentColor: 'var(--purple)',
    resources: [
      { name: 'InterviewBit Puzzles', url: 'https://www.interviewbit.com/puzzles/' },
      { name: 'GeeksforGeeks Puzzles', url: 'https://www.geeksforgeeks.org/puzzles/' }
    ],
    questions: [
      {
        id: '25-horses',
        q: '25 Horses Puzzle',
        visualId: '25-horses',
        ans: `### 25 Horses Puzzle

**Goal:** Find the top 3 fastest horses out of 25 using a track with a maximum capacity of 5 horses per race. No timer is available.

#### Solution:
1. **Race 1-5:** Split the 25 horses into 5 groups of 5. Race each group.
   - Group A: A1, A2, A3, A4, A5 (ranked A1 > A2 > A3 > A4 > A5)
   - Group B: B1 > B2 > B3
   - Group C: C1 > C2 > C3
   - Group D: D1 > D2 > D3
   - Group E: E1 > E2 > E3
2. **Race 6 (Winners Race):** Race the winners of the previous 5 races: A1, B1, C1, D1, E1.
   - Let's assume the result is: A1 > B1 > C1 > D1 > E1.
   - **Result:** A1 is definitely the overall fastest horse (Rank 1).
   - Horses from Group D and E cannot be in the top 3 since their winners finished 4th and 5th.
3. **Analyze Candidates for Rank 2 and 3:**
   - Candidate for Rank 2: A2 or B1.
   - Candidate for Rank 3: A3 (if A2 is 2nd), B2 (if B1 is 2nd), or C1 (if B1 is 2nd).
   - This leaves 5 candidate horses: A2, A3, B1, B2, C1.
4. **Race 7:** Race these 5 candidates. The 1st and 2nd finishers of this race are the overall Rank 2 and Rank 3 horses.

**Total Races needed:** 7.`
      },
      {
        id: '8-balls',
        q: '8 Ball Puzzle',
        visualId: '8-balls',
        ans: `### 8 Ball Puzzle

**Goal:** You have 8 identical-looking balls. 7 weigh the same, and 1 is slightly heavier. Find the heavier ball using a balance scale only twice.

#### Solution:
1. **Step 1:** Divide the balls into three groups: 3, 3, and 2.
2. **Step 2:** Weigh the two groups of 3 against each other (Group 1 vs Group 2).
   - **Scenario A (Balanced):** The heavier ball is in the group of 2.
     - Weigh the remaining 2 balls against each other. The heavier one is found. (2 Weighings total).
   - **Scenario B (Unbalanced):** The heavier ball is in the heavier group of 3.
     - Pick 2 balls from the heavier group of 3 and weigh them against each other.
     - If they balance, the 3rd unweighed ball is the heavier one.
     - If they don't balance, the heavier one is found. (2 Weighings total).`
      },
      {
        id: 'bridge-torch',
        q: 'Bridge and Torch',
        visualId: 'bridge-torch',
        ans: `### Bridge and Torch Puzzle

**Goal:** Four people (A, B, C, D) must cross a bridge at night. They have one torch. The bridge can hold at most 2 people at a time. Anyone crossing must carry the torch.
- Speeds: A takes 1 min, B takes 2 mins, C takes 5 mins, D takes 10 mins.
- If two cross together, they move at the speed of the slower person.

#### Solution:
The key is to send the two slowest people (C and D) together so their times overlap, but avoid having them carry the torch back.

1. **A and B cross** (takes 2 mins). B stays, **A returns** with torch (takes 1 min). *[Elapsed: 3 mins]*
2. **C and D cross** (takes 10 mins). C & D stay, **B returns** with torch (takes 2 mins). *[Elapsed: 15 mins]*
3. **A and B cross** again (takes 2 mins). *[Elapsed: 17 mins]*

**Minimum Time:** 17 minutes.`
      },
      {
        id: 'water-jug',
        q: 'Water Jug Puzzle',
        visualId: 'water-jug',
        ans: `### Water Jug Puzzle

**Goal:** Measure exactly 4 liters of water using an infinite water supply and two unmarked jugs: one 3-liter and one 5-liter.

#### Solution:
1. **Fill the 5-liter jug** completely. (5L: 5, 3L: 0)
2. **Pour 5L into the 3-liter jug** until it is full. This leaves 2 liters in the 5L jug. (5L: 2, 3L: 3)
3. **Empty the 3-liter jug**. (5L: 2, 3L: 0)
4. **Pour the 2L** from the 5L jug into the 3L jug. (5L: 0, 3L: 2)
5. **Fill the 5-liter jug** again. (5L: 5, 3L: 2)
6. **Pour water from the 5L jug** into the 3L jug until it is full (it needs exactly 1 more liter).
7. **Result:** The 5-liter jug now contains exactly **4 liters** of water. (5L: 4, 3L: 3).`
      },
      {
        id: '100-prisoners',
        q: '100 Prisoners',
        visualId: '100-prisoners',
        ans: `### 100 Prisoners Puzzle

**Goal:** 100 numbered prisoners are offered survival if each can find their own number inside one of 100 closed boxes containing random numbers from 1 to 100. Each prisoner can open up to 50 boxes. They cannot communicate once the process begins. If even one prisoner fails, all are executed.
- Random guessing yields a success chance of (1/2)^100.
- Find a strategy that gives a **>30%** survival rate.

#### Loop Strategy Solution:
1. Every prisoner starts by opening the box labeled with **their own prisoner number**.
2. They look at the card inside. If it is their number, they succeed.
3. If it is a different number X, they go and open the **box labeled X**.
4. They repeat this process, following the numbers as pointers, until they either find their number or run out of their 50 attempts.

#### Why it Works:
This divides the 100 boxes into closed permutation cycles. If no cycle is longer than 50, every single prisoner will find their number. The probability that a random permutation of 100 elements has no cycle longer than 50 is approximately **31.18%**.`
      },
      {
        id: 'egg-dropping',
        q: 'Egg Dropping',
        visualId: 'egg-dropping',
        ans: `### Egg Dropping Puzzle

**Goal:** Find the lowest floor of a 100-story building from which an egg breaks when dropped. You are given 2 identical eggs. Find the minimum number of drops needed in the worst-case scenario.

#### Solution:
If we drop the first egg at regular intervals (e.g. every 10 floors), and it breaks, we must scan the floors below one-by-one with the second egg. To minimize the worst-case drops, the total drops should remain constant regardless of where the egg breaks.
Let the first drop be at floor x. If it breaks, we need x-1 more drops (total x drops).
If it doesn't break, our next drop should be at floor x + (x-1) so that if it breaks there, our total drops remain 1 + 1 + (x-2) = x.
Following this sequence, we need:
x + (x-1) + (x-2) + ... + 1 >= 100
x(x+1)/2 >= 100
For x = 14:
14 * 15 / 2 = 105 >= 100

**Minimum Drops Needed:** 14 drops (dropping at floors 14, 27, 39, 50, 60, 69, 77, 84, 90, 95, 99, 100).`
      },
      {
        id: 'coin-flip',
        q: 'Coin Flip Riddle',
        visualId: 'coin-flip',
        ans: `### Biased Coin Flip Riddle

**Goal:** You have a biased coin that lands on Heads with probability p and Tails with probability 1-p. How can you simulate a fair 50/50 coin flip?

#### Solution:
Flipping the biased coin twice yields four possible outcomes:
1. **Heads, Heads (HH):** Probability p^2
2. **Heads, Tails (HT):** Probability p(1-p)
3. **Tails, Heads (TH):** Probability (1-p)p
4. **Tails, Tails (TT):** Probability (1-p)^2

#### Strategy:
- Note that the probability of **HT** and **TH** are exactly identical (p(1-p)).
- Flip the coin in pairs:
  - If the outcome is **HT**, return **Heads**.
  - If the outcome is **TH**, return **Tails**.
  - If the outcome is **HH** or **TT**, discard the flips and start over.

Because HT and TH have equal probability, this algorithm is mathematically guaranteed to be perfectly fair (50/50).`
      },
      {
        id: 'poisoned-bottle',
        q: 'Poisoned Bottle',
        visualId: 'poisoned-bottle',
        ans: `### 1000 Bottles & 10 Rats Puzzle

**Goal:** You have 1000 bottles of wine. Exactly 1 is poisoned. A rat dies within 24 hours of drinking any amount of the poison. Find the poisoned bottle in exactly 24 hours using at most 10 rats.

#### Solution (Binary Encoding):
Since 2^10 = 1024 > 1000, we can uniquely identify each bottle using a 10-bit binary number.

1. **Label the bottles** from 1 to 1000 in binary (e.g. Bottle 1 = 0000000001, Bottle 1000 = 1111101000).
2. **Assign each rat** to a binary bit position (Rat 1 represents Bit 0, Rat 2 represents Bit 1, ..., Rat 10 represents Bit 9).
3. For each bottle, feed a drop of its wine to Rat i if the i-th bit of the bottle's binary number is **1**.
4. Wait 24 hours.
5. Compile the results: If Rat i dies, write a **1** for the i-th bit. If Rat i survives, write a **0**.
6. The resulting 10-bit binary number points exactly to the poisoned bottle (e.g. if Rats 1 and 3 die, the binary is 0000000101 = Bottle 5).`
      },
      {
        id: 'pirate-gold',
        q: 'Pirate Gold Division',
        visualId: 'pirate-gold',
        ans: `### Pirate Gold Division (5 Pirates, 100 Gold Coins)

**Goal:** 5 rational, greedy, and survival-oriented pirates (ranked 1 to 5, where 5 is the captain) must divide 100 gold coins. The captain proposes a distribution. All pirates vote. If >= 50% vote yes, the proposal passes. If not, the captain is thrown overboard, and the next senior pirate (4) becomes captain and proposes. Find the optimal proposal for Pirate 5.

#### Solution (Work Backwards):
- **If only 2 pirates remain (2 and 1):** Pirate 2 needs only 1 vote (50% of 2 = 1 vote). Pirate 2 votes for himself, giving 100 to himself and 0 to Pirate 1. Proposal: [99, 100] = [0, 100]. Pirate 1 gets 0.
- **If 3 pirates remain (3, 2, and 1):** Pirate 3 needs 2 votes (50% of 3 = 2 votes). Pirate 3 can bribe Pirate 1 by offering him 1 coin (which is better than the 0 coins Pirate 1 would get if Pirate 3 dies). Proposal: [3: 99, 2: 0, 1: 1].
- **If 4 pirates remain (4, 3, 2, 1):** Pirate 4 needs 2 votes. He can bribe Pirate 2 with 1 coin (better than the 0 coins Pirate 2 gets in 3-pirate state). Proposal: [4: 99, 3: 0, 2: 1, 1: 0].
- **If all 5 pirates remain (5, 4, 3, 2, 1):** Pirate 5 needs 3 votes. He can bribe Pirate 3 and Pirate 1 with 1 coin each (better than the 0 they get in the 4-pirate state).

**Optimal Allocation for Pirate 5:**
- **Pirate 5 (Proposer):** 98 coins
- **Pirate 4:** 0 coins
- **Pirate 3:** 1 coin
- **Pirate 2:** 0 coins
- **Pirate 1:** 1 coin`
      },
      {
        id: 'clock-angle',
        q: 'Clock Angle',
        visualId: 'clock-angle',
        ans: `### Clock Angle Puzzle

**Goal:** Find the angle between the hour and minute hands of an analog clock at a specific time, say 3:15.

#### Formula Mechanics:
- A clock is a 360 degree circle with 12 hour marks. Each hour slot is 360/12 = 30 degrees.
- **Minute Hand movement:** Moves 360 degrees in 60 minutes, which is 6 degrees per minute.
- **Hour Hand movement:** Moves 30 degrees in 60 minutes, which is 0.5 degrees per minute.

#### Example: 3:15
1. **Minute Hand Position:** At 15 minutes, it points exactly at the 3 o'clock mark: 15 * 6 = 90 degrees.
2. **Hour Hand Position:** In 15 minutes, it has drifted past the 3 o'clock mark by: 3 * 30 + 15 * 0.5 = 97.5 degrees.
3. **Difference:** |97.5 - 90| = 7.5 degrees.

**Result:** The angle at 3:15 is **7.5 degrees**.`
      },
      {
        id: 'train-crossing',
        q: 'Train Crossing',
        visualId: 'train-crossing',
        ans: `### Train Crossing Riddles

**Goal:** Standard speed-distance brainteasers involving relative motion.
*Example:* Two trains, each 100m long, running in opposite directions, cross each other in 10 seconds. If they run in the same direction, the faster train passes the slower one in 30 seconds. Find their speeds.

#### Solution:
- Total distance to cross each other is the sum of their lengths: 100m + 100m = 200m.
- Let the speed of the faster train be u and the slower train be v.
- **Opposite Direction (Relative Speed = u + v):**
  u + v = Distance / Time = 200 / 10 = 20 m/s
- **Same Direction (Relative Speed = u - v):**
  u - v = Distance / Time = 200 / 30 = 6.67 m/s
- Adding the equations: 2u = 26.67 => u = 13.33 m/s.
- Subtracting: v = 6.67 m/s.`
      },
      {
        id: 'river-crossing',
        q: 'River Crossing',
        visualId: 'river-crossing',
        ans: `### River Crossing (Fox, Goose, and Bag of Beans)

**Goal:** A farmer must transport a fox, a goose, and a bag of beans across a river using a boat that can only hold the farmer and one item at a time.
- If left unattended: the fox will eat the goose, or the goose will eat the beans.

#### Solution:
1. **Take the Goose across** (Fox and Beans are safe together). Leave Goose on the other side, return alone.
2. **Take the Fox across**. Leave Fox, but **bring the Goose back** with you.
3. Leave the Goose on the starting side, and **take the Beans across**. Leave Beans with Fox (safe). Return alone.
4. **Take the Goose across** a final time.

**Result:** All three items successfully cross the river safely.`
      },
      {
        id: 'dice-probability',
        q: 'Probability Dice Questions',
        visualId: 'dice-probability',
        ans: `### Probability Dice Questions

*Example:* What is the probability of rolling a sum of 9 when rolling two fair 6-sided dice?

#### Solution:
1. **Total Outcomes:** Each die has 6 outcomes, so rolling two dice yields 6 * 6 = 36 equally likely outcomes.
2. **Favorable Outcomes (Sum = 9):**
   - (3, 6)
   - (4, 5)
   - (5, 4)
   - (6, 3)
   - Total of 4 favorable combinations.
3. **Probability Calculation:**
   P(Sum = 9) = 4 / 36 = 1 / 9 = 11.11%`
      },
      {
        id: 'monty-hall',
        q: 'Monty Hall Problem',
        visualId: 'monty-hall',
        ans: `### The Monty Hall Problem

**Goal:** You are on a game show. There are 3 doors: behind one is a car, behind the other two are goats. You pick a door (e.g. Door 1). The host (who knows what is behind the doors) opens another door (e.g. Door 3) which has a goat. He then asks: "Do you want to switch to Door 2?" Should you switch?

#### Solution:
**Yes, you should always switch.** Switching increases your winning probability from **1/3 to 2/3**.

#### Mathematical Explanation:
- When you first chose, the probability that you picked the car is **1/3**. The probability that the car is behind one of the other doors is **2/3**.
- By opening a goat door from the remaining options, Monty Hall is filtering the remaining 2/3 probability area down to the single unselected door.
- If you stick with your original door, your odds remain **1/3**. If you switch, your odds become **2/3**.`
      },
      {
        id: 'logical-deduction',
        q: 'Logical Deduction Puzzles',
        visualId: 'logical-deduction',
        ans: `### Logical Deduction Puzzles

Standard logic-grid elimination riddles.
*Example:* There are 3 boxes. One contains gold, the other two are empty. Each box has a message, and only one message is true.
- Box 1: "The gold is not here."
- Box 2: "The gold is in Box 3."
- Box 3: "The gold is in Box 2."
Where is the gold?

#### Solution:
- Assume the gold is in **Box 1**:
  - Box 1 statement is False.
  - Box 2 statement is False.
  - Box 3 statement is False.
  - All statements are false (Violates "only one message is true").
- Assume the gold is in **Box 2**:
  - Box 1 statement is True.
  - Box 2 statement is False.
  - Box 3 statement is True.
  - Two statements are true (Violates "only one message is true").
- Assume the gold is in **Box 3**:
  - Box 1 statement is True ("gold is not here" - Box 3 has it).
  - Box 2 statement is True ("gold is in Box 3").
  - Box 3 statement is False.
  - Two statements are true (Violates).
- Wait, let's re-verify the rules:
  - If Box 1 message is: "The gold is in Box 2."
  - Let's check Box 1 statement: "The gold is not in Box 2."
  - Let's construct a clean riddle:
    - Box 1: "Gold is in this box."
    - Box 2: "Gold is not in this box."
    - Box 3: "Gold is not in Box 1."
    - If Box 2 is True (Gold is in 1 or 3).
    - If Box 3 is True (Gold is in 2 or 3).
    - If only one statement is true, we test candidates systematically to find the unique valid configuration.`
      }
    ]
  },
  linux: {
    title: 'Linux Commands & Kernel',
    description: 'Learn terminal command execution pipelines, zombie processes, inodes, file permissions, and live system debugging.',
    icon: 'LINUX',
    accentColor: 'var(--green)',
    resources: [
      { name: 'TechWorld with Nana (DevOps)', url: 'https://www.youtube.com/@TechWorldwithNana' },
      { name: 'Linux Journey Tutorials', url: 'https://linuxjourney.com/' },
      { name: 'The Linux Command Line Guide', url: 'http://linuxcommand.org/tlcl.php' }
    ],
    questions: [
      {
        id: 'terminal-execution',
        q: 'What happens when you type a command in terminal?',
        visualId: 'terminal-execution',
        ans: `### Linux Command Execution Internals

When you type \`ls -l\` and hit Enter in a shell (e.g., bash):

1. **Parser & Lexer:**
   - The shell parses the text into command (\`ls\`) and arguments (\`-l\`).
2. **Expansion & Alias Lookup:**
   - Resolves aliases (e.g. \`ll\` -> \`ls -l\`) and environment variables.
3. **Path Resolution:**
   - Checks if the command is a shell builtin (e.g. \`cd\`).
   - If not, searches directories listed in the \`$PATH\` variable left-to-right to find the executable binary file.
4. **Forking a Child Process:**
   - Shell calls the \`fork()\` system call to spawn a child process copy of itself.
5. **Executing Binary:**
   - Inside the child process, \`execve()\` replaces the process image with the \`ls\` binary, loading the code and executing it.
6. **Waiting:**
   - The shell parent blocks via \`wait()\` or \`waitpid()\` until the child process completes and returns its exit code.`
      },
      {
        id: 'proc-thread-linux',
        q: 'Difference between Process and Thread?',
        visualId: 'proc-thread-linux',
        ans: `### Process vs Thread in Linux

From the Linux Kernel's perspective, both processes and threads are represented by the exact same descriptor: \`struct task_struct\`.

#### Linux Task Model:
- Linux refers to execution units as **tasks**.
- **Process:** Spawns via the \`fork()\` system call. The parent's memory pages are cloned using **Copy-on-Write (COW)**.
- **Thread:** Spawns via the \`clone()\` system call.
- The flags passed to \`clone()\` specify that the child task shares the parent's memory address space (\`CLONE_VM\`), file descriptors (\`CLONE_FILES\`), and signal handlers (\`CLONE_SIGHAND\`).

Hence, a thread is simply a task that shares resources with its creator, whereas a process is a task with independent page tables.`
      },
      {
        id: 'zombie-process',
        q: 'What is a Zombie Process?',
        visualId: 'zombie-process',
        ans: `### Zombie Processes in Linux

A **Zombie Process** is a process that has completed execution but still has an entry in the system process table.

#### How it happens:
1. A child process completes its execution and exits.
2. It releases its allocated memory but keeps its PID and exit status inside the kernel's process table so its parent can read it.
3. If the parent fails to call \`wait()\` or \`waitpid()\` to read this exit code, the child remains in a "Zombie" state (Z status in \`top\` or \`ps\`).

#### Prevention:
- Ensure parents handle \`SIGCHLD\` signals and call \`wait()\` on exit.
- Zombie processes do not consume memory, but they do consume PIDs. If the parent dies, the init/systemd process (PID 1) inherits the zombie and automatically reaps it.`
      },
      {
        id: 'daemon-process',
        q: 'What is a Daemon Process?',
        visualId: 'daemon-process',
        ans: `### Daemon Processes in Linux

A **Daemon** is a background process that runs continuously, detached from any interactive user terminal session. Daemons handle system service requests (e.g., \`sshd\`, \`httpd\`, \`cron\`).

#### Creation Steps (Double-Forking):
1. **Fork once:** Clones the parent process. The parent exits, making the child run in the background.
2. **setsid():** Spawns a new session and group, making the process the session leader and detaching it from the controlling terminal.
3. **Fork again:** Spawns another child and exits the session leader. This prevents the daemon from re-acquiring a controlling terminal.
4. **Close descriptors:** Close standard input, output, and error streams (0, 1, 2) and redirect them to \`/dev/null\`.
5. **Change directory:** Shift working directory to root (\`/\`) to avoid blocking filesystem unmounts.`
      },
      {
        id: 'links-linux',
        q: 'Difference between Hard Link and Soft Link?',
        visualId: 'links-linux',
        ans: `### Hard Link vs Soft (Symbolic) Link

Links are pointers pointing to files in a filesystem.

| Property | Hard Link | Soft Link (Symlink) |
| :--- | :--- | :--- |
| **Concept** | A direct pointer to the inode containing the raw file data. | A separate file containing the path string to the target. |
| **Inode Number** | Shares the **exact same** Inode number as original. | Has its own **unique** Inode number. |
| **Cross-Filesystem**| Cannot link across different filesystems/mounts. | Can link files across different filesystems. |
| **If Original Deleted**| File content is preserved until the last link is deleted. | The symlink becomes "broken" or dangling. |
| **Directory Linking**| Cannot link directory entries. | Can link directory folders. |

#### Commands:
\`\`\`bash
ln original.txt hardlink.txt # Create hard link
ln -s original.txt softlink.txt # Create soft link
\`\`\``
      },
      {
        id: 'inode-linux',
        q: 'What is an inode in Linux?',
        visualId: 'inode-linux',
        ans: `### Inodes in Linux

An **inode** (index node) is a metadata structure in Unix-style filesystems that stores all details about a file or directory **except for its name and the actual data content**.

#### Metadata stored in an inode:
- File size (in bytes).
- Permissions (read, write, execute permissions).
- Owner and Group IDs.
- Timestamps (mtime, ctime, atime).
- Pointers to data blocks on the disk holding the file's raw content.
- Hard link counter.

#### How filenames work:
- A directory is simply a table mapping filename string keys to their corresponding **inode numbers**. When you open a file, Linux resolves the filename to an inode number, loads the metadata, and reads the linked data blocks.`
      },
      {
        id: 'chmod-755',
        q: 'Explain chmod 755.',
        visualId: 'chmod-755',
        ans: `### File Permissions & chmod 755

In Linux, file permissions are divided into three categories: **Owner (User), Group, and Others**.

Permissions are represented by octal digits or character sets (\`rwx\`):
- **r (read):** Value = 4
- **w (write):** Value = 2
- **x (execute):** Value = 1

#### Parsing "755":
- **First Digit (7):** Owner permissions => 4+2+1 = 7 (Read, Write, and Execute - \`rwx\`).
- **Second Digit (5):** Group permissions => 4+0+1 = 5 (Read and Execute - \`r-x\`).
- **Third Digit (5):** Others permissions => 4+0+1 = 5 (Read and Execute - \`r-x\`).

Result: The owner can read, modify, and run the file. Everyone else can read and run it but cannot modify it.`
      },
      {
        id: 'kill-sigkill',
        q: 'Difference between kill and kill -9.',
        visualId: 'kill-sigkill',
        ans: `### kill vs kill -9

The \`kill\` command sends signals to processes, requesting or forcing them to terminate.

#### 1. \`kill <PID>\` (Sends SIGTERM / Signal 15)
- **Graceful termination:** Tells the process to clean up and exit.
- The process can catch or ignore this signal, allowing it to close files, flush buffers, release sockets, and terminate child processes cleanly.

#### 2. \`kill -9 <PID>\` (Sends SIGKILL / Signal 9)
- **Forceful termination:** Cannot be caught, blocked, or ignored by the process.
- The kernel immediately destroys the process space.
- **Risk:** Can cause database corruption or orphaned child processes since the program has no chance to clean up.`
      },
      {
        id: 'grep-find-locate',
        q: 'Difference between grep, find, and locate.',
        visualId: 'grep-find-locate',
        ans: `### Search Tools: grep vs find vs locate

| Tool | Purpose | Search Target | Search Location | Speed |
| :--- | :--- | :--- | :--- | :--- |
| **grep** | Searches for patterns inside text files. | File contents matching regex. | Current folder or specified files. | Medium (scans file content). |
| **find** | Searches the directory tree structure. | File names, sizes, dates, permissions. | Live directory tree scan. | Slower (live filesystem traversal). |
| **locate** | Quick filename search. | Filenames matching keyword. | Pre-built database index (/var/lib/mlocate). | Fast (reads index; index must be updated). |

#### Examples:
\`\`\`bash
grep "error" syslog.log # Search text in file
find /var/log -name "*.log" # Scan filesystem for log files
locate syslog.log # Look up index database
\`\`\``
      },
      {
        id: 'redirect-operators',
        q: 'Difference between > and >>.',
        visualId: 'redirect-operators',
        ans: `### Output Redirection Operators: > vs >>

Redirection operators pipe standard output (stdout) of a command into a file.

#### 1. The \`>\` Operator (Overwrite)
- Truncates the target file if it exists, erasing all contents, and writes the command output.

\`\`\`bash
echo "Hello" > file.txt # file.txt now contains only "Hello"
\`\`\`

#### 2. The \`>>\` Operator (Append)
- Preserves existing contents of the target file and appends the command output to the end of the file.

\`\`\`bash
echo "World" >> file.txt # file.txt now contains "Hello\\nWorld"
\`\`\``
      },
      {
        id: 'pipe-operator',
        q: 'What is Pipe (|) in Linux?',
        visualId: 'pipe-operator',
        ans: `### The Pipe Operator (|) in Linux

A **pipe** links the output of one process directly to the input of another, enabling command chaining.

#### Internally:
- The shell creates a pipe buffer in kernel memory.
- It maps the **standard output (stdout / fd 1)** of Command A to the write-end of the pipe.
- It maps the **standard input (stdin / fd 0)** of Command B to the read-end of the pipe.
- Both programs execute concurrently.

\`\`\`bash
cat names.txt | grep "John" | sort
# Cat prints names -> grep filters for 'John' -> sort orders them.
\`\`\``
      },
      {
        id: 'swap-memory',
        q: 'What is Swap Memory?',
        visualId: 'swap-memory',
        ans: `### Swap Memory in Linux

**Swap memory** is a designated space on a hard drive or SSD (a swap partition or swap file) that the kernel uses as extension RAM when physical memory (RAM) is full.

#### How it works (Paging):
- The kernel identifies inactive memory pages in RAM (memory allocated to idle programs).
- It writes these pages to the Swap space on disk (**paging out**) to free up physical RAM.
- When the idle program resumes, the kernel reads its pages back into RAM (**paging in**).
- **Thrashing:** If RAM is too small, the system constantly swaps pages in and out, causing performance to drop significantly because disk operations are much slower than RAM.`
      },
      {
        id: 'ram-full-oom',
        q: 'What happens when RAM gets full?',
        visualId: 'ram-full-oom',
        ans: `### Out-of-Memory (OOM) Killer in Linux

When physical RAM and Swap space are both completely exhausted, the system cannot allocate any more memory. To prevent a kernel panic or complete system lockup, the Linux kernel invokes the **Out-of-Memory (OOM) Killer**.

#### OOM Killer Action:
1. Reviews all running processes and assigns them an **OOM Score** (/proc/<PID>/oom_score).
2. High-scoring processes are those that consume a large amount of memory and are not system-critical.
3. The kernel selects the process with the highest score and sends it a **SIGKILL (Signal 9)** to immediately reclaim its memory.
4. System services can be shielded from OOM by adjusting their \`oom_score_adj\` settings.`
      },
      {
        id: 'tcp-udp',
        q: 'Difference between TCP and UDP?',
        visualId: 'tcp-udp',
        ans: `### TCP vs UDP

Core Transport Layer protocols:

| Feature | TCP (Transmission Control Protocol) | UDP (User Datagram Protocol) |
| :--- | :--- | :--- |
| **Connection** | Connection-oriented (requires 3-way handshake). | Connectionless. Sends packets immediately. |
| **Reliability** | Guaranteed delivery (retransmits lost packets). | Best-effort delivery. Packets can be lost. |
| **Ordering** | Guarantees packets are assembled in order. | No ordering guarantees. |
| **Speed** | Slower (due to headers, handshakes, flow control).| Extremely fast (minimal overhead). |
| **Header Size** | Large (20-60 bytes). | Small (8 bytes). |
| **Use Case** | Web browsing (HTTP), Email, SSH, database. | Live video streaming, gaming, DNS. |`
      },
      {
        id: 'http-https',
        q: 'Difference between HTTP and HTTPS?',
        visualId: 'http-https',
        ans: `### HTTP vs HTTPS

#### 1. HTTP (HyperText Transfer Protocol)
- Transmits data in clear plain text over port 80.
- Vulnerable to eavesdropping and man-in-the-middle attacks.

#### 2. HTTPS (HTTP Secure)
- Encrypts traffic over port 443.
- Relies on **TLS/SSL** protocols to establish an encrypted tunnel.
- **Authentication:** Uses certificates signed by Certificate Authorities (CA) to verify website identity.
- Uses asymmetric encryption for handshakes and symmetric encryption for session traffic.`
      },
      {
        id: 'ssh-linux',
        q: 'What is SSH?',
        visualId: 'ssh-linux',
        ans: `### SSH (Secure Shell)

**SSH** is a cryptographic network protocol used to run command-line shells on remote servers securely over port 22.

#### Key Exchange & Authentication:
1. **Handshake:** Client and server exchange public keys to establish a secure, symmetrically encrypted session.
2. **Authentication:**
   - **Password-based:** Sends encrypted credentials.
   - **Key-based (Recommended):** The server verifies that the client holds the private key matching the public key stored in the server's \`~/.ssh/authorized_keys\` file.
   - Uses challenge-response signatures to authenticate without transmitting the private key.`
      },
      {
        id: 'cron-job',
        q: 'What is Cron Job?',
        visualId: 'cron-job',
        ans: `### Cron Jobs in Linux

A **cron job** is a scheduled background task managed by the system daemon **crond**.

#### Syntax:
Cron configurations are stored in "crontabs" using a 5-field format:
\`\`\`text
*  *  *  *  *  command_to_execute
│  │  │  │  │
│  │  │  │  └─── Day of Week (0-6, Sunday=0)
│  │  │  └────── Month (1-12)
│  │  └───────── Day of Month (1-31)
│  └──────────── Hour (0-23)
└─────────────── Minute (0-59)
\`\`\`

#### Examples:
\`\`\`bash
0 0 * * * /backup.sh    # Runs backup script every midnight
*/15 * * * * /check.sh  # Runs check script every 15 minutes
\`\`\``
      },
      {
        id: 'env-variables',
        q: 'What is Environment Variable and PATH?',
        visualId: 'env-variables',
        ans: `### Environment Variables & The PATH

#### Environment Variables
- Dynamic values stored by the shell environment.
- Any child process spawned by the shell inherits these variables.
- Example: \`export DATABASE_URL="localhost:5432"\`

#### The PATH Variable (\`$PATH\`)
- A colon-separated list of directories.
- When you run a command without specifying a path, the shell searches these directories left-to-right to find the corresponding binary.

\`\`\`bash
echo $PATH
# Output: /usr/local/bin:/usr/bin:/bin
# Executing 'ls' searches /usr/local/bin, then /usr/bin, then /bin.
\`\`\``
      },
      {
        id: 'fork-exec-linux',
        q: 'Explain fork() and exec().',
        visualId: 'fork-exec-linux',
        ans: `### fork() and exec() System Calls

The foundation of Unix process creation:

#### 1. \`fork()\`
- Clones the calling process, creating a new child process.
- **Copy-on-Write (COW):** The child initially shares all memory pages of the parent. Pages are copied only when modified.
- **Return Code:** Returns **0** inside the child process, and returns the **child's PID** inside the parent process.

#### 2. \`exec()\` (e.g. \`execve\`)
- Replaces the current process image (code, stack, heap, registers) with a new binary program.
- Does not create a new process; it replaces the current program while preserving the PID.

#### Lifecycle Flow:
\`\`\`c
pid_t pid = fork();
if (pid == 0) {
    // Inside child
    execve("/bin/ls", args, env);
} else {
    // Inside parent - wait for child to finish
    wait(NULL);
}
\`\`\``
      },
      {
        id: 'server-debugging',
        q: 'Your production server is down — how will you debug?',
        visualId: 'server-debugging',
        ans: `### Production Server Down: Debugging Checklist

A systematic approach to diagnosing server failures:

1. **Verify Connectivity (Is it reachable?):**
   - Run \`ping\` or check port reachability using \`telnet\` / \`nc\`.
2. **Check System Resource Usage (\`top\`, \`htop\`, \`free\`, \`df\`):**
   - **CPU/RAM:** Is a process thrashing or hanging the CPU?
   - **Disk Space:** Is the root directory at 100% capacity? (Common cause of write failures and crashes).
3. **Inspect Active Network Ports (\`netstat\`, \`ss\`, \`lsof\`):**
   - Is the application listening on the correct port?
4. **Inspect Log Files (\`journalctl\`, \`/var/log/\`):**
   - Check application and syslog entries for error logs.
5. **Check Service Status (\`systemctl status\`):**
   - Is the service running, dead, or looping in crash-restarts?`
      }
    ]
  },
  git: {
    title: 'Git Version Control',
    description: 'Learn Git DAG repository structures, stash index, pull vs fetch, rebase vs merge, and detached HEAD states.',
    icon: 'GIT',
    accentColor: 'var(--pink)',
    resources: [
      { name: 'Git Official Documentation', url: 'https://git-scm.com/doc' },
      { name: 'Kunal Kushwaha Git Playlist', url: 'https://www.youtube.com/playlist?list=PL9gnSGHSqcnq3F56mSqWry3u2_gCsc_wB' },
      { name: 'CodeWithHarry Git Playlist', url: 'https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRtDYofxWYJX-ODyT' }
    ],
    questions: [
      {
        id: 'what-is-git',
        q: 'What is Git?',
        visualId: 'what-is-git',
        ans: `### What is Git?

**Git** is a distributed version control system (VCS) designed to track file changes across multiple developers.

#### Key Features:
- **Distributed model:** Every developer keeps a full local copy of the repository history.
- **Directed Acyclic Graph (DAG):** Commits are stored as nodes in a graph where each commit points to its parent(s).
- **Data Integrity:** Commits are identified by SHA-1 hash digests, guaranteeing that history cannot be changed undetected.`
      },
      {
        id: 'git-vs-github',
        q: 'Difference between Git and GitHub?',
        visualId: 'git-vs-github',
        ans: `### Git vs GitHub

- **Git:** The local command-line tool that performs version control operations (commits, branches, merges).
- **GitHub:** A cloud-based hosting platform that stores Git repositories online, adding tools like Pull Requests, Issue tracking, CI/CD pipelines, and user permission management.`
      },
      {
        id: 'git-repo',
        q: 'What is a Repository?',
        visualId: 'git-repo',
        ans: `### What is a Repository in Git?

A **Repository (Repo)** is a folder that tracks and stores the project history.

#### Internally:
- It contains the **Working Directory** (your local files) and the hidden **\`.git\` directory**.
- Inside \`.git/\`:
  - **objects/**: Stores all compressed commit snapshots, tree objects, and file blobs.
  - **refs/**: Stores text files containing commit hashes pointing to branch heads and tags.
  - **index**: The staging area buffer.`
      },
      {
        id: 'pull-vs-fetch',
        q: 'Difference between git pull and git fetch?',
        visualId: 'pull-vs-fetch',
        ans: `### git pull vs git fetch

#### 1. \`git fetch\`
- Connects to the remote repository and downloads new commits and branches.
- Updates remote-tracking references (e.g., \`origin/main\`).
- **Safe:** Does **not** modify your active working directory or merge changes.

#### 2. \`git pull\`
- Combines \`git fetch\` and \`git merge\` in a single step.
- Downloads remote commits and merges them directly into your active branch.
- **Risk:** Can trigger merge conflicts immediately.

\`\`\`bash
git fetch origin
git merge origin/main
# Equates to:
git pull origin main
\`\`\``
      },
      {
        id: 'merge-vs-rebase',
        q: 'Difference between git merge and git rebase?',
        visualId: 'merge-vs-rebase',
        ans: `### git merge vs git rebase

Two ways to integrate changes from one branch into another:

#### 1. \`git merge\`
- Spawns a new **merge commit** combining both branches.
- Preserves the chronological history of commits and branches.
- Can create cluttered, non-linear commit graphs.

#### 2. \`git rebase\`
- Re-applies local commits on top of the target branch's head commit.
- Rewrites commit hashes to create a clean, **linear commit history**.
- **Rule:** Never rebase commits that have been pushed to public remote branches.`
      },
      {
        id: 'git-branch',
        q: 'What is a Branch in Git?',
        visualId: 'git-branch',
        ans: `### What is a Branch in Git?

In Git, a branch is not a copy of directories. It is simply a **lightweight, mutable pointer to a specific commit**.

#### Internally:
- A branch reference is stored in \`.git/refs/heads/<branch-name>\` as a tiny text file containing a 40-character commit hash.
- Creating a branch is virtually instantaneous because it only writes a 41-byte text file.`
      },
      {
        id: 'pull-requests',
        q: 'Why do we use Pull Requests?',
        visualId: 'pull-requests',
        ans: `### Pull Requests (PR)

A **Pull Request** (or Merge Request) is a collaborative feature on platforms like GitHub or GitLab.

#### Purpose:
- Requests that maintainers merge your feature branch commits into the main branch.
- Provides a interface for code reviews, inline discussions, automated testing checks (CI), and status checks before integration.`
      },
      {
        id: 'git-stash',
        q: 'What is Git Stash?',
        visualId: 'git-stash',
        ans: `### Git Stash

\`git stash\` saves your uncommitted changes (both staged and unstaged) to a local stack, returning your working directory to a clean state.

#### Use Case:
- You are mid-way through a feature, and need to switch branches to fix a production bug. You cannot commit unfinished work. Stashing allows you to save your changes and apply them later.

\`\`\`bash
git stash          # Save changes
git stash list     # List stashes
git stash pop      # Apply and remove the last saved change
\`\`\``
      },
      {
        id: 'reset-vs-revert',
        q: 'Difference between git reset and git revert?',
        visualId: 'reset-vs-revert',
        ans: `### git reset vs git revert

Both undo commits, but they differ in how they affect repository history:

#### 1. \`git reset\` (Rewrites History)
- Moves the current branch pointer backward in time.
- **Modes:**
  - \`--soft\`: Keeps file changes staged in the index.
  - \`--mixed\` (Default): Unstages file changes.
  - \`--hard\`: Discards all local changes completely.
- **Rule:** Do not use reset on commits that have already been pushed to a remote repository.

#### 2. \`git revert\` (Preserves History)
- Creates a **brand new commit** that applies inverse changes to undo a target commit.
- Safe for public remote branches because it does not rewrite existing commit history.

\`\`\`bash
git reset --hard HEAD~1 # Discard last commit locally
git revert abc1234      # Safely undo commit abc1234 publicly
\`\`\``
      },
      {
        id: 'merge-conflict',
        q: 'What is a Merge Conflict?',
        visualId: 'merge-conflict',
        ans: `### What is a Merge Conflict?

A **Merge Conflict** occurs when Git cannot automatically reconcile differences between two commits.

#### Triggers:
- Two developers modify the same line of code in the same file on different branches.
- One developer deletes a file that another developer is modifying.`
      },
      {
        id: 'resolve-merge-conflict',
        q: 'How do you resolve merge conflicts?',
        visualId: 'resolve-merge-conflict',
        ans: `### Resolving Merge Conflicts

1. Run \`git merge\` or \`git pull\`. Git flags conflict files.
2. Open files. Look for conflict markers:
   \`\`\`text
   <<<<<<< HEAD
   Your changes on active branch
   =======
   Changes from incoming branch
   >>>>>>> origin/main
   \`\`\`
3. Edit the file to remove markers and keep the desired code.
4. Stage the resolved files: \`git add <file>\`.
5. Finalize the merge: \`git commit\`.`
      },
      {
        id: 'local-vs-remote-repo',
        q: 'Difference between Local Repository and Remote Repository?',
        visualId: 'local-vs-remote-repo',
        ans: `### Local vs Remote Repository

- **Local Repository:** Resides on your local machine (\`.git\` folder). You can commit, branch, and log offline.
- **Remote Repository:** Hosted on a shared server (GitHub, GitLab). Serves as the source of truth for team collaboration (interacted with via \`push\` and \`pull\`).`
      },
      {
        id: 'gitignore',
        q: 'What is .gitignore?',
        visualId: 'gitignore',
        ans: `### What is .gitignore?

A \`.gitignore\` file is a text file containing rules listing filenames and glob patterns that Git should ignore.

#### Commonly Ignored Files:
- Dependency folders (e.g. \`node_modules/\`, \`venv/\`).
- Compiled build binaries (e.g. \`dist/\`, \`*.exe\`, \`*.class\`).
- Environment secrets (e.g. \`.env\`).
- OS system metadata files (e.g. \`.DS_Store\`).`
      },
      {
        id: 'clone-vs-fork',
        q: 'Difference between git clone and git fork?',
        visualId: 'clone-vs-fork',
        ans: `### git clone vs git fork

- **git clone:** A Git command that downloads a copy of an online repository to your local machine.
- **git fork:** A platform-level feature (on GitHub) that copies a target repository to your own GitHub account, enabling pull requests back to the original project without write permissions.`
      },
      {
        id: 'git-head',
        q: 'What is HEAD in Git?',
        visualId: 'git-head',
        ans: `### What is HEAD in Git?

**HEAD** is a special reference pointer indicating your current position in the commit history.

#### Internally:
- It typically points to your active local branch (e.g., pointing to \`refs/heads/main\`).
- The branch pointer, in turn, points to the latest commit.
- If HEAD points to a specific commit hash directly instead of a branch pointer, the repository enters a **Detached HEAD** state.`
      },
      {
        id: 'git-add-dot',
        q: 'Difference between git add . and git add <file>?',
        visualId: 'git-add-dot',
        ans: `### git add . vs git add <file>

- **\`git add <file>\`:** Stages changes for a specific file path only.
- **\`git add .\`:** Stages all new, modified, and deleted files in the current folder and subdirectories recursively.`
      },
      {
        id: 'detached-head',
        q: 'What is Detached HEAD state?',
        visualId: 'detached-head',
        ans: `### Detached HEAD State

A **Detached HEAD** state occurs when Git's HEAD pointer points directly to a specific commit hash instead of a local branch pointer.

#### How to trigger:
\`\`\`bash
git checkout <commit-hash>
\`\`\`

#### Impact:
- You can browse code or compile at this historical point.
- **Warning:** Any new commits made in this state are orphaned and can be garbage collected when you switch back to a branch. To save them, create a new branch: \`git checkout -b new-branch-name\`.`
      },
      {
        id: 'git-workflow',
        q: 'Explain Git workflow in teams.',
        visualId: 'git-workflow',
        ans: `### Git Team Workflows

#### Feature Branch Workflow:
1. Developers clone the repository and pull the latest changes.
2. Create a feature branch: \`git checkout -b feature/auth\`.
3. Make changes and commit locally.
4. Push feature branch: \`git push origin feature/auth\`.
5. Open a Pull Request on GitHub for peer code review.
6. Once approved and tested, merge it into the main branch.`
      },
      {
        id: 'undo-commit',
        q: 'How do you undo a commit?',
        visualId: 'undo-commit',
        ans: `### How to Undo a Commit

- **Soft Undo (Keep files staged):**
  \`\`\`bash
  git reset --soft HEAD~1
  \`\`\`
- **Mixed Undo (Keep file edits unstaged):**
  \`\`\`bash
  git reset HEAD~1
  \`\`\`
- **Hard Undo (Discard all changes):**
  \`\`\`bash
  git reset --hard HEAD~1
  \`\`\``
      },
      {
        id: 'local-vs-remote-fail',
        q: 'How do you debug when code works locally but fails after merge?',
        visualId: 'local-vs-remote-fail',
        ans: `### Debugging Post-Merge Failures

1. Check for **missing environment variables** or config settings on the server.
2. Run \`git log --oneline --graph\` to inspect the merge order.
3. Use **Git Bisect** to binary search the commit history and find the exact commit that broke the build.
4. Verify if local changes were overwritten by merge conflict resolutions.`
      }
    ]
  },
  sql: {
    title: 'SQL Database Queries',
    description: 'Solve database query tasks, self-joins, aggregate filters, index operations, and ACID transaction rules.',
    icon: 'SQL',
    accentColor: 'var(--cyan)',
    resources: [
      { name: 'W3Schools SQL Reference', url: 'https://www.w3schools.com/sql/' },
      { name: 'LeetCode 30 Days of SQL', url: 'https://leetcode.com/studyplan/30-days-of-sql/' }
    ],
    questions: [
      {
        id: 'nth-salary',
        q: 'Find nth highest salary using SQL',
        visualId: 'nth-salary',
        ans: `### Find Nth Highest Salary using SQL

#### Using LIMIT / OFFSET (MySQL / PostgreSQL):
\`\`\`sql
SELECT Salary 
FROM Employee 
ORDER BY Salary DESC 
LIMIT 1 OFFSET n-1;
\`\`\`
*(For 3rd highest salary, use \`LIMIT 1 OFFSET 2\`)*

#### Standard SQL Correlated Subquery (Universal):
\`\`\`sql
SELECT e1.Salary 
FROM Employee e1 
WHERE n-1 = (
    SELECT COUNT(DISTINCT e2.Salary) 
    FROM Employee e2 
    WHERE e2.Salary > e1.Salary
);
\`\`\``
      },
      {
        id: 'second-highest-salary',
        q: 'Find the 2nd highest salary from Employee table',
        visualId: 'second-highest-salary',
        ans: `### Find 2nd Highest Salary

#### Method 1: Subquery with MAX
\`\`\`sql
SELECT MAX(Salary) 
FROM Employee 
WHERE Salary < (SELECT MAX(Salary) FROM Employee);
\`\`\`

#### Method 2: LIMIT / OFFSET
\`\`\`sql
SELECT Salary 
FROM Employee 
ORDER BY Salary DESC 
LIMIT 1 OFFSET 1;
\`\`\`

#### Method 3: Handling Nulls (Safe)
\`\`\`sql
SELECT IFNULL(
    (SELECT DISTINCT Salary 
     FROM Employee 
     ORDER BY Salary DESC 
     LIMIT 1 OFFSET 1), 
    NULL
) AS SecondHighestSalary;
\`\`\``
      },
      {
        id: 'find-duplicates',
        q: 'Find duplicate records in a table',
        visualId: 'find-duplicates',
        ans: `### Find Duplicate Records in a Table

To find duplicates based on specific columns (e.g. Email):

\`\`\`sql
SELECT Email, COUNT(Email) AS Occurrences
FROM Users
GROUP BY Email
HAVING COUNT(Email) > 1;
\`\`\``
      },
      {
        id: 'delete-duplicates',
        q: 'Delete duplicate rows from a table',
        visualId: 'delete-duplicates',
        ans: `### Delete Duplicate Rows

Assume we have an \`Employee\` table with duplicate rows, and we want to keep the one with the smallest unique ID:

#### Method (Self-Join):
\`\`\`sql
DELETE e1 
FROM Employee e1
INNER JOIN Employee e2 
ON e1.Email = e2.Email 
AND e1.Id > e2.Id;
\`\`\``
      },
      {
        id: 'dept-highest-salary',
        q: 'Find highest salary department-wise',
        visualId: 'dept-highest-salary',
        ans: `### Find Highest Salary Department-wise

To find the highest salary in each department:

\`\`\`sql
SELECT DeptId, MAX(Salary) AS MaxSalary
FROM Employee
GROUP BY DeptId;
\`\`\`

To show the employee names alongside their department's maximum salary:

\`\`\`sql
SELECT e.Name, e.DeptId, e.Salary
FROM Employee e
INNER JOIN (
    SELECT DeptId, MAX(Salary) AS MaxSalary
    FROM Employee
    GROUP BY DeptId
) dept_max 
ON e.DeptId = dept_max.DeptId 
AND e.Salary = dept_max.MaxSalary;
\`\`\``
      },
      {
        id: 'earn-more-dept-avg',
        q: 'Find employees earning more than department average',
        visualId: 'earn-more-dept-avg',
        ans: `### Find Employees Earning More than Department Average

Using a correlated subquery:

\`\`\`sql
SELECT e1.Name, e1.Salary, e1.DeptId
FROM Employee e1
WHERE e1.Salary > (
    SELECT AVG(e2.Salary) 
    FROM Employee e2 
    WHERE e2.DeptId = e1.DeptId
);
\`\`\``
      },
      {
        id: 'same-salary',
        q: 'Find employees with same salary',
        visualId: 'same-salary',
        ans: `### Find Employees with the Same Salary

Using a subquery to list all employees whose salary is shared by others:

\`\`\`sql
SELECT Name, Salary
FROM Employee
WHERE Salary IN (
    SELECT Salary
    FROM Employee
    GROUP BY Salary
    HAVING COUNT(Id) > 1
)
ORDER BY Salary DESC;
\`\`\``
      },
      {
        id: 'manager-self-join',
        q: 'Find manager name along with employee name using self join',
        visualId: 'manager-self-join',
        ans: `### Find Manager Name using Self-Join

Assuming the \`Employee\` table contains a \`ManagerId\` pointing to another employee's \`Id\`:

\`\`\`sql
SELECT 
    e.Name AS EmployeeName, 
    m.Name AS ManagerName
FROM Employee e
LEFT JOIN Employee m 
ON e.ManagerId = m.Id;
\`\`\``
      },
      {
        id: 'dept-count-filter',
        q: 'Find departments having more than 5 employees',
        visualId: 'dept-count-filter',
        ans: `### Find Departments with More than 5 Employees

Use \`GROUP BY\` and filter aggregate groups using the \`HAVING\` clause:

\`\`\`sql
SELECT DeptId, COUNT(Id) AS EmployeeCount
FROM Employee
GROUP BY DeptId
HAVING COUNT(Id) > 5;
\`\`\``
      },
      {
        id: 'no-orders',
        q: 'Find customers who never placed orders',
        visualId: 'no-orders',
        ans: `### Find Customers Who Never Placed Orders

Assuming a \`Customers\` table and an \`Orders\` table containing a \`CustomerId\`:

#### Method 1: LEFT JOIN (Recommended/Fast)
\`\`\`sql
SELECT c.Name
FROM Customers c
LEFT JOIN Orders o 
ON c.Id = o.CustomerId
WHERE o.Id IS NULL;
\`\`\`

#### Method 2: NOT IN
\`\`\`sql
SELECT Name
FROM Customers
WHERE Id NOT IN (SELECT CustomerId FROM Orders);
\`\`\``
      },
      {
        id: 'delete-drop-truncate',
        q: 'Difference between DELETE, DROP, and TRUNCATE',
        visualId: 'delete-drop-truncate',
        ans: `### DELETE vs DROP vs TRUNCATE

| Property | DELETE | TRUNCATE | DROP |
| :--- | :--- | :--- | :--- |
| **Action** | Removes specific rows. | Empties the table. | Destroys the table schema and data. |
| **Type** | DML (Data Manipulation). | DDL (Data Definition). | DDL (Data Definition). |
| **WHERE Clause**| Supported. | Not supported. | Not supported. |
| **Speed** | Slow (logs row-by-row deletes). | Very fast (deallocates data pages). | Extremely fast. |
| **Transaction**| Can be rolled back. | Cannot be rolled back. | Cannot be rolled back. |`
      },
      {
        id: 'where-having',
        q: 'Difference between WHERE and HAVING',
        visualId: 'where-having',
        ans: `### WHERE vs HAVING in SQL

- **\`WHERE\`:** Filters records **before** grouping them with \`GROUP BY\`. Cannot contain aggregate functions (e.g. \`SUM()\`, \`COUNT()\`).
- **\`HAVING\`:** Filters aggregate groups **after** \`GROUP BY\` has executed.

\`\`\`sql
-- Correct
SELECT DeptId, SUM(Salary)
FROM Employee
WHERE Status = 'Active' -- Filter rows
GROUP BY DeptId
HAVING SUM(Salary) > 100000; -- Filter groups
\`\`\``
      },
      {
        id: 'sql-joins',
        q: 'Difference between INNER JOIN and LEFT JOIN',
        visualId: 'sql-joins',
        ans: `### INNER JOIN vs LEFT JOIN

Joins combine rows from multiple tables based on a related column.

- **INNER JOIN:** Returns records that have **matching values in both tables**.
- **LEFT (OUTER) JOIN:** Returns all records from the left table, and the matched records from the right table. If there is no match, the right side returns \`NULL\` values.`
      },
      {
        id: 'normalization',
        q: 'What is normalization and its types?',
        visualId: 'normalization',
        ans: `### Database Normalization

Normalization structures database tables to **minimize data redundancy** and prevent update/delete anomalies.

#### Standard Normal Forms:
1. **1NF (First Normal Form):** Attributes must be atomic (no arrays/multiple values in a cell). Unique row IDs.
2. **2NF (Second Normal Form):** Must be in 1NF, and all non-key columns must have **full functional dependency** on the primary key (no partial dependencies).
3. **3NF (Third Normal Form):** Must be in 2NF, and no non-key column can depend transitively on another non-key column (no transitive dependency).
4. **BCNF (Boyce-Codd Normal Form):** A stronger version of 3NF where for every dependency A -> B, A must be a super key.`
      },
      {
        id: 'primary-foreign-keys',
        q: 'Difference between PRIMARY KEY and FOREIGN KEY',
        visualId: 'primary-foreign-keys',
        ans: `### PRIMARY KEY vs FOREIGN KEY

- **PRIMARY KEY:** A column (or set of columns) that uniquely identifies each row in a table. It cannot contain \`NULL\` values, and values must be unique.
- **FOREIGN KEY:** A column in one table that references the Primary Key of another table, establishing a relationship and enforcing referential integrity.`
      },
      {
        id: 'db-indexing',
        q: 'What is indexing and why is it used?',
        visualId: 'db-indexing',
        ans: `### Database Indexing

An **Index** is a data structure (typically a B+ Tree) that the database engine uses to locate rows quickly without scanning the entire table.

- **Benefit:** Speeds up \`SELECT\` queries dramatically.
- **Trade-off:** Slows down \`INSERT\`, \`UPDATE\`, and \`DELETE\` operations because the index tree must be updated. Consumes additional disk space.`
      },
      {
        id: 'union-union-all',
        q: 'Difference between UNION and UNION ALL',
        visualId: 'union-union-all',
        ans: `### UNION vs UNION ALL

Used to combine query result sets. Both require matching column counts and data types.

- **\`UNION\`:** Combines rows and **removes duplicates**. It incurs a performance overhead because it sorts the data to find duplicates.
- **\`UNION ALL\`:** Combines all rows directly, **preserving duplicates**. It is much faster because no duplicate check is performed.`
      },
      {
        id: 'acid-properties',
        q: 'What are ACID properties in SQL?',
        visualId: 'acid-properties',
        ans: `### ACID Properties in Database Transactions

ACID guarantees that database transactions are processed reliably:

1. **Atomicity ("All or Nothing"):** The entire transaction succeeds, or it fails completely and is rolled back.
2. **Consistency:** A transaction must transition the database from one valid state to another, keeping all integrity constraints intact.
3. **Isolation:** Concurrent transactions execute independently without interfering with each other.
4. **Durability:** Once a transaction is committed, its changes survive system crashes.`
      },
      {
        id: 'clustered-nonclustered-index',
        q: 'Difference between clustered and non-clustered index',
        visualId: 'clustered-nonclustered-index',
        ans: `### Clustered vs Non-Clustered Indexes

- **Clustered Index:**
  - Determines the **physical storage order** of rows in the table.
  - Only **one** clustered index can exist per table (typically the Primary Key).
  - Leaf nodes contain the actual data rows.
- **Non-Clustered Index:**
  - Stored in a separate structure from the data rows.
  - Multiple non-clustered indexes can exist on a table.
  - Leaf nodes contain pointers (or clustered index keys) to the physical data rows.`
      },
      {
        id: 'subquery-correlated',
        q: 'What is subquery vs correlated subquery?',
        visualId: 'subquery-correlated',
        ans: `### Subquery vs Correlated Subquery

#### 1. Independent Subquery
- The subquery executes **once** and passes its result to the outer query.
- Does not reference columns from the outer query.

\`\`\`sql
SELECT Name FROM Employee
WHERE Salary > (SELECT AVG(Salary) FROM Employee);
\`\`\`

#### 2. Correlated Subquery
- The subquery executes **repeatedly** (once for every row processed by the outer query).
- References columns from the outer query.

\`\`\`sql
SELECT Name, DeptId FROM Employee e
WHERE e.Salary > (
    SELECT AVG(Salary) FROM Employee d 
    WHERE d.DeptId = e.DeptId
);
\`\`\``
      }
    ]
  }
};
