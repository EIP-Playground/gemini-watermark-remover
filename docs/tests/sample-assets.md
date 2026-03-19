# 样本测试资产说明

> 适用目录：`src/assets/samples`
>
> 本文档只说明样本在测试中的角色和当前已知语义，不把它当成真相来源替代代码。
> 真正的行为约束仍以 `tests/regression/sampleAssetsRemoval.test.js`、
> `tests/regression/sampleAssetsDiffBaseline.test.js`、
> `scripts/sample-benchmark.js` 为准。

## 目录约定

`src/assets/samples` 里的文件分成两类：

1. 原始输入样本
   - 文件名不带 `-fix`
   - 作为算法输入，覆盖 Gemini 水印、叠加水印、位移水印、非 Gemini 负样本等场景

2. 基线输出样本
   - 文件名带 `-fix`
   - 通常由 `pnpm export:samples` 生成
   - 作为 `tests/regression/sampleAssetsDiffBaseline.test.js` 的 diff 基线
   - 含义是“当前认可的处理结果”，不是人工修图真值

## 原始输入样本

### `4.png`

- 类型：Gemini 正样本
- 主要作用：标准 `48px` 水印的直接命中样本
- 当前用途：
  - 作为基础正样本，验证标准模板直达路径
  - 用于确认强标准匹配不会被误判为 skip

### `5.png`

- 类型：Gemini 正样本，叠加水印高难样本
- 主要作用：多次使用 Gemini 修改带水印图片后形成的叠加水印场景
- 当前语义：
  - 这是目前样本库里最值得关注的难例之一
  - 不是“检测不到”，而是“检测成立、 suppression 也存在，但残留边缘仍重”
- 当前用途：
  - `tests/regression/sampleAssetsRemoval.test.js` 里专门验证 repeated removal
  - 验证 multi-pass 不应掉进 sinkhole 式纹理塌陷
  - 验证 metadata 中 `passCount / attemptedPassCount / passStopReason`
- 当前 benchmark 结论：
  - 在 `scripts/sample-benchmark.js` 的首轮结果里，它是唯一落入 `residual-edge` 的样本
- 工程意义：
  - 后续“独立残留修复层”优先应围绕这一类样本推进

### `5.webp`

- 类型：Gemini 正样本，WebP 编码版本
- 主要作用：验证有损编码路径下的 `96px` 水印处理
- 当前用途：
  - 覆盖 WebP 输入
  - 配合 `sampleAssetsDiffBaseline` 验证有损基线容差

### `6.png`

- 类型：Gemini 正样本
- 主要作用：标准模板证据不算强，但梯度证据足够，必须通过 restoration validation
- 当前用途：
  - 验证 `validated-match`
  - 验证 `96px` 样本不应被误 skip
  - 验证标准模板路径仍可成立，不必误退到 adaptive

### `7.png`

- 类型：Gemini 正样本
- 主要作用：底部右侧轻微位移的 `48px` 水印样本
- 当前用途：
  - 验证默认锚点附近的偏移恢复
  - 验证 `validated-match`
  - 验证不会因为轻微位移而被 skip

### `large.png`

- 类型：Gemini 正样本，大图
- 主要作用：标准 `96px` 大图样本
- 当前用途：
  - 覆盖大尺寸图像的标准模板路径
  - 验证大图下的直接命中与基础安全阈值

### `large2.png`

- 类型：Gemini 正样本，大图高难样本
- 主要作用：需要 multi-pass 才能充分压低残留的样本
- 当前用途：
  - 覆盖 repeated removal 的高强度正样本
  - 验证 `standard+multipass` 路径
- 当前 benchmark 观察：
  - 属于通过样本，但明显依赖多轮剥离

### `large3.png`

- 类型：Gemini 正样本，大图
- 主要作用：高置信度 `96px` 标准样本，且会触发安全停止分支
- 当前用途：
  - 覆盖大图正样本
  - 验证 `safety-near-black` 类停止条件不会破坏整体结果

### `no-gemini.jpg`

- 类型：非 Gemini 负样本
- 主要作用：证明非 Gemini 图像不应被误改
- 当前用途：
  - 验证 skip 路径
  - 验证弱匹配区域应基本保持不变
  - 在 benchmark 中属于 `expectedGemini=false`

## `-fix` 基线输出样本

以下文件是当前认可的输出基线：

- `4-fix.png`
- `5-fix.png`
- `5-fix.webp`
- `6-fix.png`
- `7-fix.png`
- `large-fix.png`
- `large2-fix.png`
- `large3-fix.png`
- `no-gemini-fix.jpg`

它们的用途不是“额外输入样本”，而是：

- 作为 `sampleAssetsDiffBaseline` 的对比目标
- 帮助识别算法改动是否改变了既有输出
- 在 PNG 等无损路径上要求严格一致
- 在 WebP / JPEG 等有损路径上允许极小的编码漂移

## 当前测试映射

主要消费这些样本的代码路径：

- `tests/regression/sampleAssetsRemoval.test.js`
  - 检查样本是否被接受
  - 检查 residual、suppression、pass metadata、局部纹理安全性

- `tests/regression/sampleAssetsDiffBaseline.test.js`
  - 对比 `*-fix.*` 基线
  - 判断输出是否发生行为级回归

- `scripts/sample-benchmark.js`
  - 生成结构化 JSON 报告
  - 将失败样本分桶，帮助决定下一阶段算法投入方向

## 维护建议

新增样本时建议遵守以下规则：

1. 如果是新的输入样本，不要直接覆盖旧文件，使用新文件名表达新场景。
2. 如果算法行为被认可地改变，再更新对应 `-fix` 基线。
3. 新样本至少写明：
   - 是否是 Gemini 正样本
   - 主要难点是什么
   - 它希望锁定哪条回归行为
4. 像 `5.png` 这种高价值难例，优先写专门断言，而不是只丢进“大样本全量通过”集合。
