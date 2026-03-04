import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name=/^(toLocaleString|toLocaleDateString|toLocaleTimeString)$/]",
          message: "直接在渲染路径中使用本地化日期/时间方法会导致 Hydration 错误。请使用 <ClientOnly> 组件包裹或通过 useHasMounted Hook 进行判断。如果你确定此处安全，请添加 // hydration-safe 注释并使用 eslint-disable 绕过。",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
