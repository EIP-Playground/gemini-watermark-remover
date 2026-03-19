# Delayed Adaptive Fallback Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让候选选择流程只在标准路径不足时才进入 adaptive 搜索，而不是默认 eager 执行 adaptive。

**Architecture:** 保持现有“标准候选优先、恢复后验证”的主链不变，仅调整 `selectInitialCandidate()` 中 adaptive 的触发时机。优先复用现有 `shouldAttemptAdaptiveFallback()` 作为主判断，避免再引入一套并行阈值体系。

**Tech Stack:** JavaScript ESM, Node test runner, 现有 core 测试与回归测试体系

---

### Task 1: 记录改进背景与本阶段目标

**Files:**
- Create: `docs/plans/2026-03-19-algorithm-improvements.md`
- Create: `docs/plans/2026-03-19-delayed-adaptive-fallback-plan.md`

- [x] **Step 1: 写入改进记录文档**

- [x] **Step 2: 写入第一阶段执行计划**

### Task 2: 为延迟 adaptive fallback 写失败测试

**Files:**
- Modify: `tests/core/candidateSelector.test.js`
- Test: `tests/core/candidateSelector.test.js`

- [ ] **Step 1: 新增一个失败测试，锁定“标准强匹配时不应依赖 eager adaptive”**
- [x] **Step 1: 新增一个失败测试，锁定“标准强匹配时不应依赖 eager adaptive”**

测试目标：
- 当标准候选已足够强时，即使 `allowAdaptiveSearch=true`，也不应因为 adaptive 所需依赖缺失而失败。
- 用例应避免 mock，直接构造标准 `48x48` 合成样本。

- [ ] **Step 2: 运行目标测试并确认 RED**
- [x] **Step 2: 运行目标测试并确认 RED**

Run: `node --test tests/core/candidateSelector.test.js`
Expected: 新增测试失败，原因是当前实现仍会 eager 进入 adaptive 路径。

### Task 3: 实现延迟 adaptive fallback

**Files:**
- Modify: `src/core/candidateSelector.js`
- Test: `tests/core/candidateSelector.test.js`
- Test: `tests/core/watermarkProcessor.test.js`
- Test: `tests/core/adaptiveDetector.test.js`

- [ ] **Step 1: 只在标准路径不足时才进入 adaptive 评估**
- [x] **Step 1: 只在标准路径不足时才进入 adaptive 评估**

实现要求：
- 复用现有 `shouldAttemptAdaptiveFallback()`
- 不改变 `decisionTier` 的语义
- 不破坏已有的 adaptive 胜出样本

- [ ] **Step 2: 保持标准强匹配、已验证标准候选、附近标准候选的现有行为**
- [x] **Step 2: 保持标准强匹配、已验证标准候选、附近标准候选的现有行为**

- [ ] **Step 3: 仅做最小实现，不顺手重构其他模块**
- [x] **Step 3: 仅做最小实现，不顺手重构其他模块**

### Task 4: 运行相关测试并确认 GREEN

**Files:**
- Test: `tests/core/candidateSelector.test.js`
- Test: `tests/core/watermarkProcessor.test.js`
- Test: `tests/core/adaptiveDetector.test.js`
- Test: `tests/core/watermarkDecisionPolicy.test.js`
- Test: `tests/core/originalValidation.test.js`

- [ ] **Step 1: 运行候选选择测试**
- [x] **Step 1: 运行候选选择测试**

Run: `node --test tests/core/candidateSelector.test.js`
Expected: PASS

- [ ] **Step 2: 运行水印处理核心测试**
- [x] **Step 2: 运行水印处理核心测试**

Run: `node --test tests/core/watermarkProcessor.test.js`
Expected: PASS

- [ ] **Step 3: 运行 adaptive 探测测试**
- [x] **Step 3: 运行 adaptive 探测测试**

Run: `node --test tests/core/adaptiveDetector.test.js`
Expected: PASS

- [ ] **Step 4: 运行决策与归因测试**
- [x] **Step 4: 运行决策与归因测试**

Run: `node --test tests/core/watermarkDecisionPolicy.test.js tests/core/originalValidation.test.js`
Expected: PASS

### Task 5: 更新文档状态

**Files:**
- Modify: `docs/plans/2026-03-19-algorithm-improvements.md`

- [ ] **Step 1: 记录第一阶段实际落地结果**
- [x] **Step 1: 记录第一阶段实际落地结果**

- [ ] **Step 2: 标记下一阶段候选项**
- [x] **Step 2: 标记下一阶段候选项**
