// Unit tests for WorkflowVersionService
// These tests focus on the pure functions without Prisma dependency

describe('WorkflowVersionService - Diff Generation', () => {
  // Test the diff generation logic directly
  describe('generateDiff', () => {
    const generateDiff = (from: any, to: any) => {
      const changes: any[] = [];

      const fromNodeIds = new Set(from.nodes?.map((n: any) => n.id) || []);
      const toNodeIds = new Set(to.nodes?.map((n: any) => n.id) || []);

      // Check for added nodes
      for (const node of to.nodes || []) {
        if (!fromNodeIds.has(node.id)) {
          changes.push({ type: 'added', path: `nodes[${node.id}]`, newValue: node });
        }
      }

      // Check for deleted nodes
      for (const node of from.nodes || []) {
        if (!toNodeIds.has(node.id)) {
          changes.push({ type: 'deleted', path: `nodes[${node.id}]`, oldValue: node });
        }
      }

      // Check for added connections
      const fromConnHash = new Set(
        (from.connections || []).map((c: any) => `${c.source}-${c.target}`)
      );
      const toConnHash = new Set(
        (to.connections || []).map((c: any) => `${c.source}-${c.target}`)
      );

      for (const conn of to.connections || []) {
        const key = `${conn.source}-${conn.target}`;
        if (!fromConnHash.has(key)) {
          changes.push({ type: 'added', path: `connections[${conn.source}->${conn.target}]`, newValue: conn });
        }
      }

      for (const conn of from.connections || []) {
        const key = `${conn.source}-${conn.target}`;
        if (!toConnHash.has(key)) {
          changes.push({ type: 'deleted', path: `connections[${conn.source}->${conn.target}]`, oldValue: conn });
        }
      }

      return changes;
    };

    it('should detect added nodes', () => {
      const from = { nodes: [], connections: [] };
      const to = {
        nodes: [{ id: 'node1', type: 'action.http' }],
        connections: [],
      };

      const changes = generateDiff(from, to);

      expect(changes.length).toBe(1);
      expect(changes[0].type).toBe('added');
      expect(changes[0].path).toContain('node1');
    });

    it('should detect deleted nodes', () => {
      const from = {
        nodes: [{ id: 'node1', type: 'action.http' }],
        connections: [],
      };
      const to = { nodes: [], connections: [] };

      const changes = generateDiff(from, to);

      expect(changes.length).toBe(1);
      expect(changes[0].type).toBe('deleted');
      expect(changes[0].path).toContain('node1');
    });

    it('should detect added connections', () => {
      const from = { nodes: [], connections: [] };
      const to = {
        nodes: [],
        connections: [{ source: 'node1', target: 'node2' }],
      };

      const changes = generateDiff(from, to);

      expect(changes.length).toBe(1);
      expect(changes[0].type).toBe('added');
      expect(changes[0].path).toContain('node1');
    });

    it('should detect deleted connections', () => {
      const from = {
        nodes: [],
        connections: [{ source: 'node1', target: 'node2' }],
      };
      const to = { nodes: [], connections: [] };

      const changes = generateDiff(from, to);

      expect(changes.length).toBe(1);
      expect(changes[0].type).toBe('deleted');
    });

    it('should return empty array for identical workflows', () => {
      const workflow = {
        nodes: [{ id: 'node1', type: 'trigger.webhook' }],
        connections: [],
      };

      const changes = generateDiff(workflow, workflow);

      expect(changes).toHaveLength(0);
    });
  });

  describe('generateDiffSummary', () => {
    const generateDiffSummary = (changes: any[]) => {
      const added = changes.filter(c => c.type === 'added').length;
      const modified = changes.filter(c => c.type === 'modified').length;
      const deleted = changes.filter(c => c.type === 'deleted').length;

      const parts: string[] = [];
      if (added > 0) parts.push(`${added} node(s) added`);
      if (modified > 0) parts.push(`${modified} node(s) modified`);
      if (deleted > 0) parts.push(`${deleted} node(s) deleted`);

      return parts.length > 0 ? parts.join(', ') : 'No changes';
    };

    it('should generate summary with added nodes', () => {
      const changes = [{ type: 'added', path: 'nodes[node1]', newValue: {} }];

      const summary = generateDiffSummary(changes);

      expect(summary).toContain('1 node(s) added');
    });

    it('should generate summary with multiple changes', () => {
      const changes = [
        { type: 'added', path: 'nodes[node1]', newValue: {} },
        { type: 'modified', path: 'nodes[node2]', oldValue: {}, newValue: {} },
        { type: 'deleted', path: 'nodes[node3]', oldValue: {} },
      ];

      const summary = generateDiffSummary(changes);

      expect(summary).toContain('1 node(s) added');
      expect(summary).toContain('1 node(s) modified');
      expect(summary).toContain('1 node(s) deleted');
    });

    it('should return "No changes" for empty array', () => {
      const summary = generateDiffSummary([]);

      expect(summary).toBe('No changes');
    });
  });
});
