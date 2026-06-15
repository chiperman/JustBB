"use client"

import * as React from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CloudIcon,
  CheckmarkCircle01Icon as CheckIcon,
  CancelCircleIcon as ErrorIcon,
  Loading03Icon as Loader2,
} from "@hugeicons/core-free-icons"
import { AdminDialogShell } from "@/shared/ui/AdminDialogShell"
import { toast } from "@/shared/hooks/use-toast"
import {
  getR2Config,
  saveR2Config,
  deleteR2Config,
  testR2Connection,
  type R2Config,
} from "@/server/actions/settings/r2"

interface R2ConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function R2ConfigDialog({ open, onOpenChange }: R2ConfigDialogProps) {
  const [config, setConfig] = React.useState<R2Config>({
    account_id: "",
    access_key_id: "",
    secret_access_key: "",
    bucket_name: "",
    public_url: "",
  })
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [testing, setTesting] = React.useState(false)
  const [hasExistingConfig, setHasExistingConfig] = React.useState(false)
  const [testResult, setTestResult] = React.useState<"success" | "error" | null>(null)
  const [showSecret, setShowSecret] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setLoading(true)
    setTestResult(null)
    getR2Config().then((res) => {
      if (res.data) {
        setHasExistingConfig(true)
        setConfig(res.data)
      } else {
        setHasExistingConfig(false)
        setConfig({
          account_id: "",
          access_key_id: "",
          secret_access_key: "",
          bucket_name: "",
          public_url: "",
        })
      }
      setLoading(false)
    })
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    const res = await saveR2Config(config)
    setSaving(false)

    if (res.success) {
      toast({ title: "R2 配置已保存" })
      onOpenChange(false)
    } else {
      toast({
        title: "保存失败",
        description: res.error,
        variant: "destructive",
      })
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const res = await testR2Connection(config)
    setTesting(false)
    setTestResult(res.success ? "success" : "error")

    if (res.success) {
      toast({ title: "连接成功" })
    } else {
      toast({
        title: "连接失败",
        description: res.error,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    const res = await deleteR2Config()
    if (res.success) {
      toast({ title: "配置已清除" })
      setHasExistingConfig(false)
      setConfig({
        account_id: "",
        access_key_id: "",
        secret_access_key: "",
        bucket_name: "",
        public_url: "",
      })
      setTestResult(null)
    } else {
      toast({
        title: "清除失败",
        description: res.error,
        variant: "destructive",
      })
    }
  }

  const updateField = (key: keyof R2Config, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setTestResult(null)
  }

  const isComplete =
    config.account_id &&
    config.access_key_id &&
    config.secret_access_key &&
    config.bucket_name &&
    config.public_url

  return (
    <AdminDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Cloudflare R2 配置"
      subtitle="配置图片上传的 R2 存储服务"
      icon={CloudIcon}
      maxWidth="max-w-[520px]"
      footer={
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleTest}
              disabled={!isComplete || testing}
              className="gap-2"
            >
              {testing ? (
                <HugeiconsIcon icon={Loader2} size={14} className="animate-spin" />
              ) : testResult === "success" ? (
                <HugeiconsIcon icon={CheckIcon} size={14} className="text-green-500" />
              ) : testResult === "error" ? (
                <HugeiconsIcon icon={ErrorIcon} size={14} className="text-red-500" />
              ) : null}
              <span className="text-xs">测试连接</span>
            </Button>
            {hasExistingConfig && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <span className="text-xs">清除配置</span>
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || !isComplete}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      }
    >
      <div
        className={`space-y-5 transition-opacity duration-200 ${
          loading ? "opacity-30 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="space-y-2">
          <Label htmlFor="r2-account-id">Account ID</Label>
          <Input
            id="r2-account-id"
            placeholder="Cloudflare Account ID"
            value={config.account_id}
            onChange={(e) => updateField("account_id", e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="r2-access-key">Access Key ID</Label>
          <Input
            id="r2-access-key"
            placeholder="R2 API Token Access Key ID"
            value={config.access_key_id}
            onChange={(e) => updateField("access_key_id", e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="r2-secret-key">Secret Access Key</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => setShowSecret((v) => !v)}
              disabled={loading}
            >
              {showSecret ? "隐藏" : "显示"}
            </Button>
          </div>
          <Input
            id="r2-secret-key"
            type={showSecret ? "text" : "password"}
            placeholder="R2 API Token Secret Access Key"
            value={config.secret_access_key}
            onChange={(e) => updateField("secret_access_key", e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="r2-bucket">Bucket 名称</Label>
          <Input
            id="r2-bucket"
            placeholder="my-bucket"
            value={config.bucket_name}
            onChange={(e) => updateField("bucket_name", e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="r2-public-url">公开访问 URL</Label>
          <Input
            id="r2-public-url"
            placeholder="https://pub-xxx.r2.dev 或自定义域名"
            value={config.public_url}
            onChange={(e) => updateField("public_url", e.target.value)}
            disabled={loading}
          />
          <p className="text-[11px] text-muted-foreground">
            R2 Bucket 的公开访问地址，用于生成图片链接
          </p>
        </div>
      </div>
    </AdminDialogShell>
  )
}
