import { problems } from '../../hot100/catalog.mjs';

export const sourceCommit = '8c8da55de17fd7ce04f0cc3f84cf82fc56e7e3d1';

const sourcePaths = new Map([
  [1, "solution/0000-0099/0001.Two Sum/README.md"],
  [49, "solution/0000-0099/0049.Group Anagrams/README.md"],
  [128, "solution/0100-0199/0128.Longest Consecutive Sequence/README.md"],
  [283, "solution/0200-0299/0283.Move Zeroes/README.md"],
  [11, "solution/0000-0099/0011.Container With Most Water/README.md"],
  [15, "solution/0000-0099/0015.3Sum/README.md"],
  [42, "solution/0000-0099/0042.Trapping Rain Water/README.md"],
  [3, "solution/0000-0099/0003.Longest Substring Without Repeating Characters/README.md"],
  [438, "solution/0400-0499/0438.Find All Anagrams in a String/README.md"],
  [560, "solution/0500-0599/0560.Subarray Sum Equals K/README.md"],
  [239, "solution/0200-0299/0239.Sliding Window Maximum/README.md"],
  [76, "solution/0000-0099/0076.Minimum Window Substring/README.md"],
  [53, "solution/0000-0099/0053.Maximum Subarray/README.md"],
  [56, "solution/0000-0099/0056.Merge Intervals/README.md"],
  [189, "solution/0100-0199/0189.Rotate Array/README.md"],
  [238, "solution/0200-0299/0238.Product of Array Except Self/README.md"],
  [41, "solution/0000-0099/0041.First Missing Positive/README.md"],
  [73, "solution/0000-0099/0073.Set Matrix Zeroes/README.md"],
  [54, "solution/0000-0099/0054.Spiral Matrix/README.md"],
  [48, "solution/0000-0099/0048.Rotate Image/README.md"],
  [240, "solution/0200-0299/0240.Search a 2D Matrix II/README.md"],
  [160, "solution/0100-0199/0160.Intersection of Two Linked Lists/README.md"],
  [206, "solution/0200-0299/0206.Reverse Linked List/README.md"],
  [234, "solution/0200-0299/0234.Palindrome Linked List/README.md"],
  [141, "solution/0100-0199/0141.Linked List Cycle/README.md"],
  [142, "solution/0100-0199/0142.Linked List Cycle II/README.md"],
  [21, "solution/0000-0099/0021.Merge Two Sorted Lists/README.md"],
  [2, "solution/0000-0099/0002.Add Two Numbers/README.md"],
  [19, "solution/0000-0099/0019.Remove Nth Node From End of List/README.md"],
  [24, "solution/0000-0099/0024.Swap Nodes in Pairs/README.md"],
  [25, "solution/0000-0099/0025.Reverse Nodes in k-Group/README.md"],
  [138, "solution/0100-0199/0138.Copy List with Random Pointer/README.md"],
  [148, "solution/0100-0199/0148.Sort List/README.md"],
  [23, "solution/0000-0099/0023.Merge k Sorted Lists/README.md"],
  [146, "solution/0100-0199/0146.LRU Cache/README.md"],
  [94, "solution/0000-0099/0094.Binary Tree Inorder Traversal/README.md"],
  [104, "solution/0100-0199/0104.Maximum Depth of Binary Tree/README.md"],
  [226, "solution/0200-0299/0226.Invert Binary Tree/README.md"],
  [101, "solution/0100-0199/0101.Symmetric Tree/README.md"],
  [543, "solution/0500-0599/0543.Diameter of Binary Tree/README.md"],
  [102, "solution/0100-0199/0102.Binary Tree Level Order Traversal/README.md"],
  [108, "solution/0100-0199/0108.Convert Sorted Array to Binary Search Tree/README.md"],
  [98, "solution/0000-0099/0098.Validate Binary Search Tree/README.md"],
  [230, "solution/0200-0299/0230.Kth Smallest Element in a BST/README.md"],
  [199, "solution/0100-0199/0199.Binary Tree Right Side View/README.md"],
  [114, "solution/0100-0199/0114.Flatten Binary Tree to Linked List/README.md"],
  [105, "solution/0100-0199/0105.Construct Binary Tree from Preorder and Inorder Traversal/README.md"],
  [437, "solution/0400-0499/0437.Path Sum III/README.md"],
  [236, "solution/0200-0299/0236.Lowest Common Ancestor of a Binary Tree/README.md"],
  [124, "solution/0100-0199/0124.Binary Tree Maximum Path Sum/README.md"],
  [200, "solution/0200-0299/0200.Number of Islands/README.md"],
  [994, "solution/0900-0999/0994.Rotting Oranges/README.md"],
  [207, "solution/0200-0299/0207.Course Schedule/README.md"],
  [208, "solution/0200-0299/0208.Implement Trie (Prefix Tree)/README.md"],
  [46, "solution/0000-0099/0046.Permutations/README.md"],
  [78, "solution/0000-0099/0078.Subsets/README.md"],
  [17, "solution/0000-0099/0017.Letter Combinations of a Phone Number/README.md"],
  [39, "solution/0000-0099/0039.Combination Sum/README.md"],
  [22, "solution/0000-0099/0022.Generate Parentheses/README.md"],
  [79, "solution/0000-0099/0079.Word Search/README.md"],
  [131, "solution/0100-0199/0131.Palindrome Partitioning/README.md"],
  [51, "solution/0000-0099/0051.N-Queens/README.md"],
  [35, "solution/0000-0099/0035.Search Insert Position/README.md"],
  [74, "solution/0000-0099/0074.Search a 2D Matrix/README.md"],
  [34, "solution/0000-0099/0034.Find First and Last Position of Element in Sorted Array/README.md"],
  [33, "solution/0000-0099/0033.Search in Rotated Sorted Array/README.md"],
  [153, "solution/0100-0199/0153.Find Minimum in Rotated Sorted Array/README.md"],
  [4, "solution/0000-0099/0004.Median of Two Sorted Arrays/README.md"],
  [20, "solution/0000-0099/0020.Valid Parentheses/README.md"],
  [155, "solution/0100-0199/0155.Min Stack/README.md"],
  [394, "solution/0300-0399/0394.Decode String/README.md"],
  [739, "solution/0700-0799/0739.Daily Temperatures/README.md"],
  [84, "solution/0000-0099/0084.Largest Rectangle in Histogram/README.md"],
  [215, "solution/0200-0299/0215.Kth Largest Element in an Array/README.md"],
  [347, "solution/0300-0399/0347.Top K Frequent Elements/README.md"],
  [295, "solution/0200-0299/0295.Find Median from Data Stream/README.md"],
  [121, "solution/0100-0199/0121.Best Time to Buy and Sell Stock/README.md"],
  [55, "solution/0000-0099/0055.Jump Game/README.md"],
  [45, "solution/0000-0099/0045.Jump Game II/README.md"],
  [763, "solution/0700-0799/0763.Partition Labels/README.md"],
  [70, "solution/0000-0099/0070.Climbing Stairs/README.md"],
  [118, "solution/0100-0199/0118.Pascal's Triangle/README.md"],
  [198, "solution/0100-0199/0198.House Robber/README.md"],
  [279, "solution/0200-0299/0279.Perfect Squares/README.md"],
  [322, "solution/0300-0399/0322.Coin Change/README.md"],
  [139, "solution/0100-0199/0139.Word Break/README.md"],
  [300, "solution/0300-0399/0300.Longest Increasing Subsequence/README.md"],
  [152, "solution/0100-0199/0152.Maximum Product Subarray/README.md"],
  [416, "solution/0400-0499/0416.Partition Equal Subset Sum/README.md"],
  [32, "solution/0000-0099/0032.Longest Valid Parentheses/README.md"],
  [62, "solution/0000-0099/0062.Unique Paths/README.md"],
  [64, "solution/0000-0099/0064.Minimum Path Sum/README.md"],
  [5, "solution/0000-0099/0005.Longest Palindromic Substring/README.md"],
  [1143, "solution/1100-1199/1143.Longest Common Subsequence/README.md"],
  [72, "solution/0000-0099/0072.Edit Distance/README.md"],
  [136, "solution/0100-0199/0136.Single Number/README.md"],
  [169, "solution/0100-0199/0169.Majority Element/README.md"],
  [75, "solution/0000-0099/0075.Sort Colors/README.md"],
  [31, "solution/0000-0099/0031.Next Permutation/README.md"],
  [287, "solution/0200-0299/0287.Find the Duplicate Number/README.md"]
]);

const catalog = new Map(problems.map(problem => [problem.id, problem]));
const rawRoot = 'https://raw.githubusercontent.com/doocs/leetcode/';
const attributionRoot = 'https://github.com/doocs/leetcode/blob/';
const licenseUrl = 'https://creativecommons.org/licenses/by-sa/4.0/';

function payload(row) {
  return { id: row.question_id, language: row.language, html: row.html,
    sourceUrl: row.source_url, sourceCommit: row.source_sha,
    license: 'CC BY-SA 4.0', licenseUrl, fetchedAt: row.fetched_at };
}

export function extractStatement(text, slug) {
  const start = text.indexOf('<!-- description:start -->');
  const end = text.indexOf('<!-- description:end -->', start);
  if (start < 0 || end < 0 || !text.slice(0, start).includes('https://leetcode.cn/problems/' + slug)) {
    throw new Error('The original problem section is unavailable');
  }
  const html = text.slice(start + '<!-- description:start -->'.length, end).trim();
  if (html.length < 80 || html.length > 100000 || !/[\u4e00-\u9fff]/.test(html)) {
    throw new Error('The Chinese problem section is incomplete');
  }
  return html;
}

export async function readStatement(db, account, id, fetchSource = fetch) {
  const problem = catalog.get(id);
  if (!problem) return Response.json({ error: '题目不存在' }, { status: 404 });
  const saved = await db.prepare(
    'SELECT * FROM statement_cache WHERE account = ? AND question_id = ? AND language = ?'
  ).bind(account, id, 'zh-CN').first();
  if (saved?.source_sha === sourceCommit) return Response.json(payload(saved));

  try {
    const path = sourcePaths.get(id).split('/').map(encodeURIComponent).join('/');
    const response = await fetchSource(rawRoot + sourceCommit + '/' + path, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('The source is temporarily unavailable');
    const html = extractStatement(await response.text(), problem.slug);
    const row = { account, question_id: id, language: 'zh-CN', html,
      source_url: attributionRoot + sourceCommit + '/' + path, source_sha: sourceCommit,
      fetched_at: Math.floor(Date.now() / 1000) };
    await db.prepare(
      'INSERT INTO statement_cache (account, question_id, language, html, source_url, source_sha, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?) ' +
      'ON CONFLICT(account, question_id, language) DO UPDATE SET html = excluded.html, source_url = excluded.source_url, source_sha = excluded.source_sha, fetched_at = excluded.fetched_at'
    ).bind(account, id, row.language, html, row.source_url, sourceCommit, row.fetched_at).run();
    return Response.json(payload(row));
  } catch {
    if (saved) return Response.json(payload(saved));
    return Response.json({ error: '题面暂时无法读取，请稍后重试' }, { status: 503 });
  }
}
