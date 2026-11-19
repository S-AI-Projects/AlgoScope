/**
 * Displayed source-code collection for Graph Search algorithms.
 * Note: This module exports displayed code strings for syntax display,
 * not an executable step-generator API.
 */

/**
 * Metadata and failure-path documentation for graph search displayed sources.
 */
export const GRAPH_SEARCH_METADATA = {
  firstAlgorithm: 'bfs',
  primaryLanguage: 'javascript',
  entry: 'bfs',
  language: 'javascript',
  displayedExample: {
    startNode: 1,
    expectedOutput: [1, 2, 5, 6, 3, 7, 4, 9, 8],
    description: 'Breadth-First Search traversal starting from node 1 on the embedded 9-node graph.',
  },
  independentlyComputedExample: {
    startNode: 8,
    expectedOutput: [8, 7, 9, 2, 5, 1, 3, 4, 6],
    description: 'Breadth-First Search traversal starting from node 8 on the embedded 9-node graph.',
  },
  unsupportedInputs: [
    {
      input: 999,
      category: 'Non-existent node',
      behavior: 'isolated-halt',
      description:
        'Node 999 does not exist in the hardcoded graph. The snippet processes 999 and immediately halts without visiting valid graph nodes.',
    },
    {
      input: null,
      category: 'Invalid null input',
      behavior: 'spurious-visit',
      description:
        'Null input is accepted by Set/Array without validation and logged as null, producing an invalid traversal sequence.',
    },
  ],
}

export const graphSearchSources = {
  bfs: {
    metadata: {
      algorithm: 'bfs',
      supportedInputs: 'Integer node ID present in graph (1..9)',
      unsupportedInputs: [999, null, undefined],
    },
    javascript: {
      code: `// Graph represented as an adjacency list
const graph = {
  1: [2, 5, 6], 2: [1, 3, 7], 3: [2, 4, 6],
  4: [3, 5, 6], 5: [1, 4, 6, 9], 6: [1, 3, 4, 5],
  7: [2, 8, 9], 8: [7, 9], 9: [5, 7, 8]
};

function bfs(startNode) {
  const visited = new Set();
  const queue = [startNode];
  visited.add(startNode);

  while (queue.length > 0) {
    const node = queue.shift();
    console.log(node); // Process the current node

    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}`,
      lineMap: {
        graphDef: 2,
        function: 11,
        visitedSet: 12,
        queueInit: 13,
        whileLoop: 16,
        dequeue: 17,
        process: 18,
        neighborLoop: 20,
        visitedCheck: 21,
        enqueue: 23,
      },
    },
    python: {
      code: `from collections import deque

# Graph represented as an adjacency list
graph = {
    1: [2, 5, 6], 2: [1, 3, 7], 3: [2, 4, 6],
    4: [3, 5, 6], 5: [1, 4, 6, 9], 6: [1, 3, 4, 5],
    7: [2, 8, 9], 8: [7, 9], 9: [5, 7, 8]
}

def bfs(start_node):
    visited = set()
    queue = deque([start_node])
    visited.add(start_node)

    while queue:
        node = queue.popleft()
        print(node)  # Process the current node

        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`,
      lineMap: {
        imports: 1,
        graphDef: 4,
        function: 10,
        visitedSet: 11,
        queueInit: 12,
        whileLoop: 15,
        dequeue: 16,
        process: 17,
        neighborLoop: 19,
        visitedCheck: 20,
        enqueue: 22,
      },
    },
    cpp: {
      code: `#include <iostream>
#include <vector>
#include <queue>
#include <map>
#include <set>

void bfs(const std::map<int, std::vector<int>>& graph, int startNode) {
    std::set<int> visited;
    std::queue<int> q;

    visited.insert(startNode);
    q.push(startNode);

    while (!q.empty()) {
        int node = q.front();
        q.pop();
        std::cout << node << " "; // Process the current node

        if (graph.count(node)) {
            for (int neighbor : graph.at(node)) {
                if (visited.find(neighbor) == visited.end()) {
                    visited.insert(neighbor);
                    q.push(neighbor);
                }
            }
        }
    }
}`,
    },
    java: {
      code: `import java.util.*;

public class BFS {
    static Map<Integer, List<Integer>> graph = new HashMap<>();
    
    static {
        graph.put(1, Arrays.asList(2, 5, 6));
        graph.put(2, Arrays.asList(1, 3, 7));
        graph.put(3, Arrays.asList(2, 4, 6));
        graph.put(4, Arrays.asList(3, 5, 6));
        graph.put(5, Arrays.asList(1, 4, 6, 9));
        graph.put(6, Arrays.asList(1, 3, 4, 5));
        graph.put(7, Arrays.asList(2, 8, 9));
        graph.put(8, Arrays.asList(7, 9));
        graph.put(9, Arrays.asList(5, 7, 8));
    }
    
    public static void bfs(int startNode) {
        Set<Integer> visited = new HashSet<>();
        Queue<Integer> queue = new LinkedList<>();
        
        visited.add(startNode);
        queue.add(startNode);
        
        while (!queue.isEmpty()) {
            int node = queue.poll();
            System.out.print(node + " "); 
            
            for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.add(neighbor);
                }
            }
        }
    }
}`,
    },
    c: {
      code: `#include <stdio.h>
#include <stdbool.h>

#define MAX_NODES 10

void bfs(int graph[MAX_NODES][MAX_NODES], int startNode, int n) {
    bool visited[MAX_NODES] = {false};
    int queue[MAX_NODES];
    int front = 0, rear = 0;

    visited[startNode] = true;
    queue[rear++] = startNode;

    while (front < rear) {
        int node = queue[front++];
        printf("%d ", node);

        for (int i = 0; i < n; i++) {
            if (graph[node][i] == 1 && !visited[i]) {
                visited[i] = true;
                queue[rear++] = i;
            }
        }
    }
}`,
    },
    rust: {
      code: `use std::collections::{VecDeque, HashSet, HashMap};

fn bfs(graph: &HashMap<i32, Vec<i32>>, start_node: i32) {
    let mut visited = HashSet::new();
    let mut queue = VecDeque::new();

    visited.insert(start_node);
    queue.push_back(start_node);

    while let Some(node) = queue.pop_front() {
        println!("{}", node);

        if let Some(neighbors) = graph.get(&node) {
            for &neighbor in neighbors {
                if !visited.contains(&neighbor) {
                    visited.insert(neighbor);
                    queue.push_back(neighbor);
                }
            }
        }
    }
}`,
    },
    go: {
      code: `func bfs(graph map[int][]int, startNode int) {
    visited := make(map[int]bool)
    queue := []int{startNode}
    visited[startNode] = true

    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        fmt.Println(node)

        for _, neighbor := range graph[node] {
            if !visited[neighbor] {
                visited[neighbor] = true
                queue = append(queue, neighbor)
            }
        }
    }
}`,
    },
  },
  dfs: {
    metadata: {
      algorithm: 'dfs',
      supportedInputs: 'Integer node ID present in graph (1..9)',
      unsupportedInputs: [999, null, undefined],
    },
    javascript: {
      code: `const graph = {
  1: [2, 5, 6], 2: [1, 3, 7], 3: [2, 4, 6],
  4: [3, 5, 6], 5: [1, 4, 6, 9], 6: [1, 3, 4, 5],
  7: [2, 8, 9], 8: [7, 9], 9: [5, 7, 8]
};

function dfs(startNode) {
    const visited = new Set();

    function traverse(node) {
        if (visited.has(node)) return;
        visited.add(node);
        console.log(node);

        for (const neighbor of graph[node] || []) {
            traverse(neighbor);
        }
    }
    traverse(startNode);
}`,
      lineMap: {
        graphDef: 1,
        function: 8,
        visitedSet: 9,
        traverseDef: 11,
        visitedCheck: 12,
        markVisited: 13,
        process: 14,
        neighborLoop: 16,
        recursiveCall: 17,
        invoke: 20,
      },
    },
    python: {
      code: `graph = {
    1: [2, 5, 6], 2: [1, 3, 7], 3: [2, 4, 6],
    4: [3, 5, 6], 5: [1, 4, 6, 9], 6: [1, 3, 4, 5],
    7: [2, 8, 9], 8: [7, 9], 9: [5, 7, 8]
}

def dfs(start_node):
    visited = set()

    def traverse(node):
        if node in visited:
            return
        visited.add(node)
        print(node)

        for neighbor in graph.get(node, []):
            traverse(neighbor)
    
    traverse(start_node)`,
      lineMap: {
        graphDef: 1,
        function: 8,
        visitedSet: 9,
        traverseDef: 11,
        visitedCheck: 12,
        markVisited: 14,
        process: 15,
        neighborLoop: 17,
        recursiveCall: 18,
        invoke: 20,
      },
    },
    cpp: {
      code: `#include <iostream>
#include <vector>
#include <map>
#include <set>

void dfs_recursive(const std::map<int, std::vector<int>>& graph, int node, std::set<int>& visited) {
    if (visited.count(node)) return;
    
    visited.insert(node);
    std::cout << node << " ";

    if (graph.count(node)) {
        for (int neighbor : graph.at(node)) {
            dfs_recursive(graph, neighbor, visited);
        }
    }
}

void dfs(const std::map<int, std::vector<int>>& graph, int startNode) {
    std::set<int> visited;
    dfs_recursive(graph, startNode, visited);
}`,
    },
    java: {
      code: `import java.util.*;

public class DFS {
    static Map<Integer, List<Integer>> graph = new HashMap<>();
    static Set<Integer> visited = new HashSet<>();
    
    public static void dfs(int startNode) {
        traverse(startNode);
    }
    
    private static void traverse(int node) {
        if (visited.contains(node)) return;
        
        visited.add(node);
        System.out.print(node + " ");
        
        for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {
            traverse(neighbor);
        }
    }
}`,
    },
    c: {
      code: `#include <stdio.h>
#include <stdbool.h>

#define MAX_NODES 10

void traverse(int graph[MAX_NODES][MAX_NODES], int node, bool visited[], int n) {
    if (visited[node]) return;

    visited[node] = true;
    printf("%d ", node);

    for (int i = 0; i < n; i++) {
        if (graph[node][i] == 1 && !visited[i]) {
            traverse(graph, i, visited, n);
        }
    }
}

void dfs(int graph[MAX_NODES][MAX_NODES], int startNode, int n) {
    bool visited[MAX_NODES] = {false};
    traverse(graph, startNode, visited, n);
}`,
    },
    rust: {
      code: `use std::collections::{HashSet, HashMap};

fn traverse(graph: &HashMap<i32, Vec<i32>>, node: i32, visited: &mut HashSet<i32>) {
    if visited.contains(&node) { return; }

    visited.insert(node);
    println!("{}", node);

    if let Some(neighbors) = graph.get(&node) {
        for &neighbor in neighbors {
            traverse(graph, neighbor, visited);
        }
    }
}

fn dfs(graph: &HashMap<i32, Vec<i32>>, start_node: i32) {
    let mut visited = HashSet::new();
    traverse(graph, start_node, &mut visited);
}`,
    },
    go: {
      code: `func traverse(graph map[int][]int, node int, visited map[int]bool) {
    if visited[node] { return }

    visited[node] = true
    fmt.Println(node)

    for _, neighbor := range graph[node] {
        traverse(graph, neighbor, visited)
    }
}

func dfs(graph map[int][]int, startNode int) {
    visited := make(map[int]bool)
    traverse(graph, startNode, visited)
}`,
    },
  },
}

export const getSource = (algorithm, language) => {
  return graphSearchSources[algorithm]?.[language]?.code || ''
}
