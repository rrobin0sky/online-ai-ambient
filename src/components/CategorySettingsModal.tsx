import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Lock,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Search,
  Gauge,
  AlertCircle,
} from 'lucide-react';
import { PlayerFilterConfig, CategoryType, QualityMode } from '../types';
import { PRESET_CATEGORIES, SUGGESTED_TAGS } from '../data/wallpapers';
import { verifyAdminPasscode, type SsoAuthState } from '../services/recommendationEngine';

interface CategorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PlayerFilterConfig;
  onUpdateConfig: (newConfig: PlayerFilterConfig, triggerFetch?: boolean) => void;
  isFetching: boolean;
  poolCount: number;
  detectedWidth: number;
  isAdminUnlocked: boolean;
  onAdminVerified: (verified: boolean) => void;
  ssoAuth?: SsoAuthState;
}

export const CategorySettingsModal: React.FC<CategorySettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  isFetching,
  poolCount,
  detectedWidth,
  isAdminUnlocked,
  onAdminVerified,
  ssoAuth,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [inputKey, setInputKey] = useState(config.passcodeOrKey);
  const [errorTip, setErrorTip] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Sync internal state when config changes
  useEffect(() => {
    setInputKey(config.passcodeOrKey);
  }, [config.passcodeOrKey]);

  if (!isOpen) return null;

  const isVipUnlocked = isAdminUnlocked || !!ssoAuth?.hasVipScope;
  const isUnlocked = isVipUnlocked;

  const handleOpenSsoLogin = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'B0_OPEN_LOGIN',
          reason: '使用 bin0sky 统一账号登录（需管理员或 ambient:vip 权限），即可同步云端收藏夹并解锁 4K VIP 源',
        },
        '*'
      );
      return;
    }
    const loginBase = /(^|\.)bin0sky\.tech$/i.test(window.location.hostname) ? 'https://bin0sky.tech' : '';
    window.location.href = `${loginBase}/#login?redirect_uri=${encodeURIComponent(window.location.href)}`;
  };

  const verifyAndApplyPasscode = async (trimmed: string, emptyMsg: string, failMsg: string) => {
    if (!trimmed) {
      setErrorTip(emptyMsg);
      return;
    }
    setIsVerifying(true);
    setErrorTip('');
    const verifiedAdmin = await verifyAdminPasscode(trimmed);
    setIsVerifying(false);

    if (verifiedAdmin) {
      onAdminVerified(true);
      onUpdateConfig({ ...config, passcodeOrKey: trimmed, adultMode: true }, true);
      return;
    }

    onAdminVerified(false);
    setErrorTip(failMsg);
  };

  const handleVerifyAndUnlock = () => {
    void verifyAndApplyPasscode(
      inputKey.trim(),
      '请输入共享访问口令',
      '密码不正确，请输入正确的访问口令'
    );
  };

  const handleToggleAdultMode = () => {
    if (config.adultMode) {
      setErrorTip('');
      onUpdateConfig({ ...config, adultMode: false }, true);
      return;
    }

    if (isVipUnlocked) {
      setErrorTip('');
      onUpdateConfig({ ...config, adultMode: true }, true);
      return;
    }

    void verifyAndApplyPasscode(
      inputKey.trim(),
      '请先在下方输入共享访问口令并验证解锁',
      '密码不正确，无法开启成人模式'
    );
  };

  const handleLock = () => {
    setInputKey('');
    setErrorTip('');
    onAdminVerified(false);
    onUpdateConfig({ ...config, passcodeOrKey: '', adultMode: false }, true);
  };

  const handleCategoryClick = (catId: CategoryType) => {
    const next = { ...config, category: catId };
    onUpdateConfig(next, true);
  };

  const qualityOptions: { id: QualityMode; title: string; badge: string; desc: string }[] = [
    {
      id: 'auto',
      title: '⚡ 智能自适应',
      badge: `当前匹配 ${detectedWidth}p WebP`,
      desc: '根据屏幕物理分辨率动态转码 WebP，体积缩小 92%，秒开且锐利',
    },
    {
      id: 'fast',
      title: '🚀 极速秒开流',
      badge: '约 250KB / 张',
      desc: '锁定高帧率轻量流媒体尺寸，适合快速连续翻图或移动网络',
    },
    {
      id: 'raw',
      title: '💎 原画无损直出',
      badge: '5MB~15MB / 张',
      desc: '不经过任何云端压缩，直接拉取原始未压缩文件',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/15 shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                4K 视觉分类与流媒体引擎
              </h2>
              <p className="text-xs text-slate-400">
                当前图池已就绪 <span className="text-indigo-300 font-semibold">{poolCount}</span> 张壁纸 · 提前 3 张内存预热已开启
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Category Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                1. 选择壁纸主题分类 (点击即刻切换)
              </label>
              <button
                onClick={() => onUpdateConfig(config, true)}
                disabled={isFetching}
                className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 font-medium cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                <span>{isFetching ? '正在云端拉取...' : '换一批新图'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {PRESET_CATEGORIES.map((cat) => {
                const active = config.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-br from-indigo-600/40 to-purple-600/30 border-indigo-400/60 shadow-lg shadow-indigo-500/15'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-base">{cat.emoji}</span>
                      {active && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />}
                    </div>
                    <span className="text-xs font-bold text-white">{cat.label}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{cat.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Adaptive Resolution & Quality Strategy */}
          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. 屏幕分辨率自适应与加速策略 (下载时始终保留 100% 原图)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {qualityOptions.map((opt) => {
                const active = (config.qualityMode || 'auto') === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() =>
                      onUpdateConfig({ ...config, qualityMode: opt.id }, true)
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-500/20 border-emerald-400/60 text-white shadow-md'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{opt.title}</span>
                    </div>
                    <div className="inline-block px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-emerald-300 font-mono mb-1">
                      {opt.badge}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Custom Keyword Input */}
          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>3. 自定义搜索标签 (支持英文关键词定向搜索 Wallhaven / Yande)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.customQuery}
                onChange={(e) =>
                  onUpdateConfig({ ...config, customQuery: e.target.value, category: 'custom' }, false)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdateConfig({ ...config, category: 'custom' }, true);
                  }
                }}
                placeholder="例如: cyberpunk 4k, aurora, asian girl, genshin..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
              <button
                onClick={() => onUpdateConfig({ ...config, category: 'custom' }, true)}
                disabled={isFetching}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shrink-0"
              >
                搜索并播放
              </button>
            </div>

            {/* Suggested Tag Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTED_TAGS.map((item) => (
                <button
                  key={item.tag}
                  onClick={() =>
                    onUpdateConfig(
                      { ...config, category: 'custom', customQuery: item.tag },
                      true
                    )
                  }
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-colors cursor-pointer ${
                    config.customQuery === item.tag && config.category === 'custom'
                      ? 'bg-indigo-500 text-white font-medium'
                      : 'bg-white/5 hover:bg-white/15 text-slate-300'
                  }`}
                >
                  #{item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Adult / NSFW Mode Section */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              config.adultMode
                ? 'bg-gradient-to-br from-rose-950/35 via-purple-950/25 to-black border-rose-500/40'
                : 'bg-white/[0.02] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    config.adultMode
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {config.adultMode ? <Flame className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">👑 云端收藏同步 & 18+ 进阶模式</span>
                    {config.adultMode && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        已启用
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    登录统一账号同步个人云端收藏；输入共享口令或使用 VIP 账号解锁全量 18+ 图库
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleAdultMode}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                  config.adultMode ? 'bg-rose-600' : 'bg-slate-700'
                }`}
                title={config.adultMode ? "点击关闭成人模式" : (isUnlocked ? "点击开启成人模式" : "需要输入访问密码解锁")}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    config.adultMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* SSO Login & Password Verification Section (shown when locked or to change key) */}
            {!isUnlocked ? (
              <div className="space-y-3 pt-3 border-t border-white/10 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-200">
                      {ssoAuth?.authenticated ? (
                        <span>已登录统一账号 <strong className="text-emerald-300">{ssoAuth.username}</strong> · 个人云端收藏夹同步已开启（18+ 需输入共享口令或开通 <code className="text-rose-300">ambient:vip</code>）</span>
                      ) : (
                        <span>登录 bin0sky 统一账号可开启个人云端收藏夹同步（VIP/管理员免密解锁 18+）：</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenSsoLogin}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shrink-0"
                    >
                      {ssoAuth?.authenticated ? '切换授权账号' : '统一账号登录 (SSO)'}
                    </button>
                  </div>

                  <div className="border-t border-white/10 pt-2.5 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      或输入共享访问口令（解锁 18+）：
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 flex items-center">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={inputKey}
                        onChange={(e) => {
                          setInputKey(e.target.value);
                          setErrorTip('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleVerifyAndUnlock();
                          }
                        }}
                        placeholder="输入共享访问口令 (解锁 18+)..."
                        className="w-full pl-3 pr-10 py-2 rounded-lg bg-black/60 border border-white/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyAndUnlock}
                      disabled={isVerifying}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shrink-0 disabled:opacity-50"
                    >
                      {isVerifying ? '校验中...' : '验证并开启'}
                    </button>
                  </div>

                  {errorTip && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorTip}</span>
                    </div>
                  )}

                  <div className="mt-2 text-[11px] text-slate-400">
                    提示：共享口令仅用于解锁 18+ 图库；如需多端云端同步个人收藏，请登录 bin0sky 统一账号。
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-3 border-t border-white/10 animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-300 font-medium">
                      {ssoAuth?.hasVipScope
                        ? `✓ 已通过统一账号 [${ssoAuth.username}] 激活云端同步与 18+ VIP 通道`
                        : ssoAuth?.authenticated
                        ? `✓ 共享口令已验证，18+ 模式已开启（已绑定 [${ssoAuth.username}] 个人云端收藏）`
                        : '✓ 共享口令已验证，18+ 模式已开启（未登录状态下收藏仅保存在本地浏览器）'}
                    </span>
                  </div>

                  {isAdminUnlocked && (
                    <button
                      type="button"
                      onClick={handleLock}
                      className="text-[11px] text-slate-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      锁定并清除密码
                    </button>
                  )}
                </div>

                {config.adultMode && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: '111', label: '全量混合 (SFW + R18)', sub: '兼顾唯美与成人内容' },
                        { id: '001', label: '纯享成人 (Pure NSFW)', sub: '仅拉取 R18 / Explicit' },
                        { id: '110', label: '微醺性感 (Sketchy)', sub: '写真与轻度性感' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            onUpdateConfig(
                              { ...config, purityMode: item.id as PlayerFilterConfig['purityMode'] },
                              true
                            )
                          }
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            config.purityMode === item.id
                              ? 'bg-rose-500/25 border-rose-400 text-white'
                              : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] opacity-75">{item.sub}</div>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.enableYande}
                          onChange={(e) =>
                            onUpdateConfig({ ...config, enableYande: e.target.checked }, true)
                          }
                          className="rounded accent-rose-500"
                        />
                        <span>启用 Yande.re 超清源</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.enableKonachan}
                          onChange={(e) =>
                            onUpdateConfig({ ...config, enableKonachan: e.target.checked }, true)
                          }
                          className="rounded accent-rose-500"
                        />
                        <span>启用 Konachan 4K 源</span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            配置已自动保存在当前浏览器本地
          </span>
          <button
            onClick={() => {
              onUpdateConfig(config, true);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            完成并应用
          </button>
        </div>
      </div>
    </div>
  );
};
