import React, { useState } from 'react';
import { CropDefinition, StudentProfile } from '../types/game';
import { CROPS_CATALOG } from '../data/englishCurriculum';
import { gameAudio } from '../services/audio';
import { Store, Coins, Check, Lock, Sparkles, X, ShoppingBag } from 'lucide-react';

interface MarketModalProps {
  profile: StudentProfile;
  onBuySeed: (crop: CropDefinition) => void;
  onClose: () => void;
}

export const MarketModal: React.FC<MarketModalProps> = ({
  profile,
  onBuySeed,
  onClose,
}) => {
  const [selectedTab, setSelectedTab] = useState<'seeds' | 'decorations'>('seeds');

  const handlePurchase = (crop: CropDefinition) => {
    if (profile.coins < crop.seedCost) {
      gameAudio.playIncorrectSound();
      return;
    }
    gameAudio.playHarvestSound();
    onBuySeed(crop);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 tracking-tight">
                Botanical Seed & Tool Market
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Earned from harvest</span>
                <span aria-hidden="true">·</span>
                <span>Language Upgrades</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-700/60 rounded-lg text-amber-300 font-mono text-xs font-bold">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{profile.coins} Coins</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-slate-950/60 border-b border-slate-800 text-xs">
          <button
            onClick={() => {
              gameAudio.playClickSound();
              setSelectedTab('seeds');
            }}
            className={`px-3.5 py-2 rounded-t-lg font-medium transition-colors cursor-pointer ${
              selectedTab === 'seeds'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            English Botanical Seeds
          </button>
          <button
            onClick={() => {
              gameAudio.playClickSound();
              setSelectedTab('decorations');
            }}
            className={`px-3.5 py-2 rounded-t-lg font-medium transition-colors cursor-pointer ${
              selectedTab === 'decorations'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Garden Perks & Upgrades
          </button>
        </div>

        {/* Catalog List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {selectedTab === 'seeds' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CROPS_CATALOG.map((crop) => {
                const isUnlocked = profile.unlockedSeeds.includes(crop.id);
                const canAfford = profile.coins >= crop.seedCost;

                return (
                  <div
                    key={crop.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isUnlocked
                        ? 'bg-slate-800/80 border-slate-700/90'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: crop.bloomColor }}
                          />
                          <h3 className="font-semibold text-sm text-slate-100">{crop.name}</h3>
                        </div>
                        <span className="text-[11px] text-amber-400 font-mono font-bold">
                          {crop.seedCost} 🪙
                        </span>
                      </div>

                      {/* Unboxed category metadata */}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="capitalize">{crop.category.replace('_', ' ')}</span>
                        <span aria-hidden="true">·</span>
                        <span>+{crop.harvestRewardXp} XP</span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{crop.description}</p>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Harvest: +{crop.harvestRewardCoins} coins
                      </span>
                      {isUnlocked ? (
                        <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <Check className="w-3.5 h-3.5" />
                          <span>In Pouch</span>
                        </div>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => handlePurchase(crop)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Buy Seeds</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  id: 'golden_can',
                  name: 'Golden Watering Can',
                  desc: 'Crafted from pure bronze. Nourishes plants twice as fast with richer soil hydration.',
                  cost: 80,
                  icon: Sparkles,
                },
                {
                  id: 'syntax_fertilizer',
                  name: 'Syntax Compost & Fertilizer',
                  desc: 'Provides +25% bonus coins and harvest XP on every completed English grammar challenge.',
                  cost: 120,
                  icon: Sparkles,
                },
                {
                  id: 'shakespeare_statue',
                  name: 'Bust of William Shakespeare',
                  desc: 'Inspires the garden with poetic vocabulary. Daily XP bonuses for correct answers.',
                  cost: 150,
                  icon: Sparkles,
                },
              ].map((perk) => (
                <div
                  key={perk.id}
                  className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-amber-300">{perk.name}</h4>
                    <p className="text-xs text-slate-300">{perk.desc}</p>
                    <span className="text-xs text-amber-400 font-mono font-bold block pt-1">
                      {perk.cost} 🪙
                    </span>
                  </div>
                  <button
                    disabled={profile.coins < perk.cost}
                    onClick={() => {
                      if (profile.coins >= perk.cost) {
                        gameAudio.playHarvestSound();
                      } else {
                        gameAudio.playIncorrectSound();
                      }
                    }}
                    className="shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    Unlock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-800/60 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <span>Earn more coins by completing plots and maintaining your daily streak!</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Back to Garden
          </button>
        </div>
      </div>
    </div>
  );
};
