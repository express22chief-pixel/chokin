import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Home, List, Settings, ChevronLeft, ChevronRight, Search } from 'lucide-react';

// 履歴ビュー(月切替 + 検索 + フィルタ)
function HistoryView({ periodExpenses, categories, fmt, deleteExpense }) {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all | カテゴリ名
  const [monthOffset, setMonthOffset] = useState(0); // 0 = 今月、-1 = 先月

  // 利用可能な月リストを作成(支出がある月のみ)
  const availableMonths = useMemo(() => {
    const set = new Set();
    periodExpenses.forEach((e) => {
      const d = new Date(e.date);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    const arr = Array.from(set).sort((a, b) => b.localeCompare(a));
    return arr;
  }, [periodExpenses]);

  // 選択中の月
  const today = new Date();
  const defaultMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthIndex = availableMonths.indexOf(defaultMonthKey);
  const effectiveIndex = Math.max(
    0,
    (currentMonthIndex >= 0 ? currentMonthIndex : 0) + monthOffset
  );
  const selectedMonthKey = availableMonths[effectiveIndex] || defaultMonthKey;
  const [sy, sm] = selectedMonthKey.split('-').map(Number);
  const monthLabel = `${sy}年${sm}月`;

  const canGoOlder = effectiveIndex < availableMonths.length - 1;
  const canGoNewer = effectiveIndex > 0;

  // 選択月の支出
  const monthExpenses = useMemo(() => {
    return periodExpenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === sy && d.getMonth() + 1 === sm;
    });
  }, [periodExpenses, sy, sm]);

  // カテゴリ集計
  const categoryTotals = useMemo(() => {
    const map = {};
    monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    return map;
  }, [monthExpenses]);

  const monthTotal = useMemo(
    () => monthExpenses.reduce((s, e) => s + Number(e.amount), 0),
    [monthExpenses]
  );

  // フィルター適用後
  const filteredExpenses = useMemo(() => {
    let result = monthExpenses;
    if (activeFilter !== 'all') {
      result = result.filter((e) => e.category === activeFilter);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (e) =>
          (e.memo && e.memo.toLowerCase().includes(q)) ||
          e.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [monthExpenses, activeFilter, searchText]);

  // 日別グルーピング
  const grouped = useMemo(() => {
    const g = {};
    filteredExpenses.forEach((e) => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [filteredExpenses]);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const weekdayNames = ['日', '月', '火', '水', '木', '金', '土'];

  // フィルター済み合計
  const filteredTotal = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);

  if (periodExpenses.length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '60px 20px',
          textAlign: 'center',
          color: '#8E8E93',
          lineHeight: 1.7,
        }}>
          まだ支出の記録がありません<br />
          右下の＋ボタンから追加してください
        </div>
      </div>
    );
  }

  // カテゴリフィルターチップ
  const categoriesWithSpend = categories.filter((c) => categoryTotals[c.name] > 0);

  return (
    <div style={{ padding: '16px' }}>
      {/* 月ナビゲーター + サマリー */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        padding: '16px 18px',
        marginBottom: '10px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}>
          <button
            onClick={() => setMonthOffset(monthOffset - 1)}
            disabled={!canGoOlder}
            style={{
              background: canGoOlder ? '#F2F2F7' : 'transparent',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: canGoOlder ? 'pointer' : 'default',
              color: canGoOlder ? '#1C1C1E' : '#C7C7CC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              {monthLabel}
            </div>
            <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '2px' }}>
              {monthExpenses.length}件の記録
            </div>
          </div>
          <button
            onClick={() => setMonthOffset(monthOffset + 1)}
            disabled={!canGoNewer}
            style={{
              background: canGoNewer ? '#F2F2F7' : 'transparent',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: canGoNewer ? 'pointer' : 'default',
              color: canGoNewer ? '#1C1C1E' : '#C7C7CC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          paddingTop: '12px',
          borderTop: '1px solid #F2F2F7',
        }}>
          <div style={{ fontSize: '11px', color: '#8E8E93', marginBottom: '2px' }}>
            月の合計
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {fmt(monthTotal)}
          </div>
        </div>
      </div>

      {/* 検索バー */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '10px 14px',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <Search size={16} color="#8E8E93" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="メモやカテゴリで検索"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            background: 'transparent',
            color: '#1C1C1E',
            fontFamily: 'inherit',
            minWidth: 0,
          }}
        />
        {searchText && (
          <button
            onClick={() => setSearchText('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#8E8E93',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '4px',
            }}
          >
            クリア
          </button>
        )}
      </div>

      {/* カテゴリフィルター(横スクロール) */}
      {categoriesWithSpend.length > 0 && (
        <div style={{
          marginBottom: '10px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="hidden-scroll"
        >
          <div style={{
            display: 'flex',
            gap: '6px',
            paddingBottom: '2px',
          }}>
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '8px 14px',
                borderRadius: '100px',
                border: 'none',
                background: activeFilter === 'all' ? '#1C1C1E' : '#FFFFFF',
                color: activeFilter === 'all' ? '#FFFFFF' : '#1C1C1E',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: 'inherit',
              }}
            >
              すべて
            </button>
            {categoriesWithSpend.map((cat) => {
              const active = activeFilter === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setActiveFilter(active ? 'all' : cat.name)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '100px',
                    border: active ? `2px solid ${cat.color}` : '1px solid transparent',
                    background: active ? cat.color + '25' : '#FFFFFF',
                    color: '#1C1C1E',
                    fontSize: '13px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 500 }}>
                    {monthExpenses.filter((e) => e.category === cat.name).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* フィルター適用中の表示 */}
      {(activeFilter !== 'all' || searchText) && (
        <div style={{
          padding: '10px 14px',
          background: '#E5F1FF',
          borderRadius: '10px',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '12px', color: '#007AFF', fontWeight: 500 }}>
            {filteredExpenses.length}件 · {fmt(filteredTotal)}
          </span>
          <button
            onClick={() => { setActiveFilter('all'); setSearchText(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#007AFF',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 6px',
              fontFamily: 'inherit',
            }}
          >
            リセット
          </button>
        </div>
      )}

      {/* 支出リスト */}
      {sortedDates.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '40px 20px',
          textAlign: 'center',
          color: '#8E8E93',
          fontSize: '13px',
        }}>
          該当する支出がありません
        </div>
      ) : (
        sortedDates.map((date) => {
          const dayTotal = grouped[date].reduce((s, e) => s + Number(e.amount), 0);
          const d = new Date(date);
          const isToday = date === new Date().toISOString().slice(0, 10);
          const dow = d.getDay();
          const dayColor = dow === 0 ? '#FF3B30' : dow === 6 ? '#007AFF' : '#1C1C1E';

          return (
            <div key={date} style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              marginBottom: '10px',
              overflow: 'hidden',
            }}>
              {/* 日付ヘッダー */}
              <div style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '1px solid #F2F2F7',
                background: isToday ? '#FFF9E6' : '#FAFAFA',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px',
                }}>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: dayColor,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}>
                    {d.getDate()}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: dayColor,
                    fontWeight: 600,
                  }}>
                    {weekdayNames[dow]}
                  </span>
                </div>
                {isToday && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#FFCC00',
                    borderRadius: '100px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#1C1C1E',
                  }}>
                    TODAY
                  </span>
                )}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: '11px', color: '#8E8E93' }}>
                  {grouped[date].length}件
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>
                  {fmt(dayTotal)}
                </span>
              </div>

              {/* その日の支出 */}
              {grouped[date].map((e, idx) => {
                const cat = categories.find((c) => c.name === e.category) || categories[categories.length - 1];
                return (
                  <div key={e.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: idx < grouped[date].length - 1 ? '1px solid #F5F5F7' : 'none',
                    gap: '12px',
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: cat.color + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '17px',
                      flexShrink: 0,
                    }}>
                      {cat.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '2px',
                      }}>
                        {e.memo || cat.name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: cat.color,
                        fontWeight: 600,
                      }}>
                        {cat.name}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                    }}>
                      {fmt(e.amount)}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('この支出を削除しますか?')) deleteExpense(e.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#C7C7CC',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}

export default function BudgetTracker() {
  const currentYear = new Date().getFullYear();
  const todayStr = () => new Date().toISOString().slice(0, 10);

  const [yearlyBudget, setYearlyBudget] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [year, setYear] = useState(currentYear);
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddSheet, setShowAddSheet] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '食費',
    memo: '',
    date: todayStr(),
  });

  const categories = [
    { name: '食費', color: '#F59E42', icon: '🍽' },
    { name: '日用品', color: '#4A90E2', icon: '🛒' },
    { name: '交通', color: '#7ED321', icon: '🚃' },
    { name: '交際', color: '#E94B87', icon: '🍻' },
    { name: '趣味', color: '#BD6FE8', icon: '🎮' },
    { name: '衣服', color: '#50C2C9', icon: '👕' },
    { name: '健康', color: '#EF5B5B', icon: '💊' },
    { name: 'その他', color: '#8E8E93', icon: '📦' },
  ];

  const [budgetDraft, setBudgetDraft] = useState('');
  const [startDateDraft, setStartDateDraft] = useState('');
  const [endDateDraft, setEndDateDraft] = useState('');

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('budget-data-v3');
        if (raw) {
          const data = JSON.parse(raw);
          if (data.yearlyBudget !== undefined) setYearlyBudget(data.yearlyBudget);
          if (data.expenses) setExpenses(data.expenses);
          if (data.year) setYear(data.year);
          if (data.startDate) setStartDate(data.startDate);
          if (data.endDate) setEndDate(data.endDate);
        }
      } catch (err) {}
      setIsLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('budget-data-v3', JSON.stringify({
        yearlyBudget, expenses, year, startDate, endDate,
      }));
    } catch (err) {}
  }, [yearlyBudget, expenses, year, startDate, endDate, isLoaded]);

  // 期間関連の計算
  const periodStart = new Date(startDate);
  const periodEnd = new Date(endDate);
  const totalPeriodDays = Math.max(
    Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24)) + 1,
    1
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normStart = new Date(periodStart);
  normStart.setHours(0, 0, 0, 0);
  const normEnd = new Date(periodEnd);
  normEnd.setHours(0, 0, 0, 0);

  const isBeforeStart = today < normStart;
  const isAfterEnd = today > normEnd;

  // 期間内の経過日数と残り日数
  const daysPassed = isBeforeStart
    ? 0
    : Math.min(
        Math.ceil((today - normStart) / (1000 * 60 * 60 * 24)) + 1,
        totalPeriodDays
      );
  const daysRemaining = Math.max(totalPeriodDays - daysPassed, 0);

  // 期間中の支出のみをフィルタ
  const periodExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const d = e.date;
        return d >= startDate && d <= endDate;
      }),
    [expenses, startDate, endDate]
  );

  const totalSpent = useMemo(
    () => periodExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [periodExpenses]
  );

  const spentByCategory = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.name] = 0;
    });
    periodExpenses.forEach((e) => {
      if (map[e.category] !== undefined) map[e.category] += Number(e.amount);
      else map['その他'] += Number(e.amount);
    });
    return map;
  }, [periodExpenses]);

  const remaining = yearlyBudget - totalSpent;
  const usagePct = yearlyBudget > 0 ? (totalSpent / yearlyBudget) * 100 : 0;

  // ペース計算
  const expectedPct = totalPeriodDays > 0 ? (daysPassed / totalPeriodDays) * 100 : 0;
  const pace = usagePct - expectedPct;
  const idealSpent = yearlyBudget * (daysPassed / totalPeriodDays);
  const diffFromIdeal = totalSpent - idealSpent;

  // 日/週/月あたりの予算
  const dailyBudget = totalPeriodDays > 0 ? yearlyBudget / totalPeriodDays : 0;
  const weeklyBudget = dailyBudget * 7;
  const monthlyBudget = dailyBudget * 30;

  // 残り予算をベースにした「これからの」ペース
  const dailyRemainingBudget = daysRemaining > 0 ? remaining / daysRemaining : 0;
  const weeklyRemainingBudget = dailyRemainingBudget * 7;
  const monthlyRemainingBudget = dailyRemainingBudget * 30;

  // 今日/今週/今月の支出
  const todayISO = todayStr();
  const todaySpent = useMemo(
    () =>
      periodExpenses
        .filter((e) => e.date === todayISO)
        .reduce((s, e) => s + Number(e.amount), 0),
    [periodExpenses, todayISO]
  );

  // 今週(月曜始まり)
  const weekStart = new Date(today);
  const dow = weekStart.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  weekStart.setDate(weekStart.getDate() + diff);
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekSpent = useMemo(
    () =>
      periodExpenses
        .filter((e) => e.date >= weekStartStr && e.date <= todayISO)
        .reduce((s, e) => s + Number(e.amount), 0),
    [periodExpenses, weekStartStr, todayISO]
  );

  // 今月
  const monthStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const monthSpent = useMemo(
    () =>
      periodExpenses
        .filter((e) => e.date >= monthStartStr && e.date <= todayISO)
        .reduce((s, e) => s + Number(e.amount), 0),
    [periodExpenses, monthStartStr, todayISO]
  );

  // 月次集計(期間内のみ、月インデックスベース)
  const monthlyTotals = useMemo(() => {
    const map = {};
    periodExpenses.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + Number(e.amount);
    });
    return map;
  }, [periodExpenses]);

  // 期間にまたがる月のリストを作成
  const periodMonths = useMemo(() => {
    const months = [];
    const cur = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
    while (cur <= periodEnd) {
      months.push({
        key: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`,
        label: `${cur.getMonth() + 1}月`,
        year: cur.getFullYear(),
        month: cur.getMonth(),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return months;
  }, [startDate, endDate]);

  const openAddSheet = () => {
    setExpenseForm({
      amount: '',
      category: '食費',
      memo: '',
      date: todayStr(),
    });
    setShowAddSheet(true);
  };

  const confirmAddExpense = () => {
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) return;
    const newExpense = {
      id: Date.now().toString(),
      amount: Number(expenseForm.amount),
      category: expenseForm.category,
      memo: expenseForm.memo,
      date: expenseForm.date,
    };
    setExpenses([newExpense, ...expenses]);
    setShowAddSheet(false);
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const confirmBudget = () => {
    const val = Number(budgetDraft);
    if (!isNaN(val) && val >= 0) {
      setYearlyBudget(val);
      setBudgetDraft('');
    }
  };

  const confirmPeriod = () => {
    if (startDateDraft && endDateDraft && startDateDraft <= endDateDraft) {
      setStartDate(startDateDraft);
      setEndDate(endDateDraft);
      setYear(new Date(startDateDraft).getFullYear());
      setStartDateDraft('');
      setEndDateDraft('');
    }
  };

  const fmt = (n) => '¥' + Math.round(n).toLocaleString('ja-JP');

  const getStatus = () => {
    if (yearlyBudget === 0) return { label: '予算未設定', color: '#8E8E93', bg: '#F2F2F7' };
    if (isBeforeStart) return { label: '開始前', color: '#8E8E93', bg: '#F2F2F7' };
    if (isAfterEnd) return { label: '終了', color: '#8E8E93', bg: '#F2F2F7' };
    if (pace > 10) return { label: '使いすぎ', color: '#FF3B30', bg: '#FFE5E3' };
    if (pace > 3) return { label: 'やや超過', color: '#FF9500', bg: '#FFF3E0' };
    if (pace < -10) return { label: '余裕あり', color: '#34C759', bg: '#E3F9E5' };
    return { label: '順調', color: '#007AFF', bg: '#E5F1FF' };
  };
  const status = getStatus();

  // 今日の予算の「使用状況」→ 表情アイコン
  const getMood = (used, budget) => {
    if (budget <= 0) return { emoji: '😐', label: '予算未設定', color: '#8E8E93' };
    const r = used / budget;
    if (r === 0) return { emoji: '🌱', label: 'まっさら', color: '#34C759' };
    if (r < 0.5) return { emoji: '😊', label: 'いい感じ', color: '#34C759' };
    if (r < 0.9) return { emoji: '🙂', label: '順調', color: '#007AFF' };
    if (r < 1.1) return { emoji: '😅', label: 'ギリギリ', color: '#FF9500' };
    if (r < 1.5) return { emoji: '😰', label: '超過', color: '#FF9500' };
    return { emoji: '🔥', label: '大幅超過', color: '#FF3B30' };
  };
  const todayMood = getMood(todaySpent, dailyRemainingBudget);

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, "Hiragino Kaku Gothic ProN", sans-serif' }}>
        <div style={{ color: '#8E8E93' }}>読み込み中…</div>
      </div>
    );
  }

  // 期間ラベル
  const periodLabel = (() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const sameYear = s.getFullYear() === e.getFullYear();
    const isFullYear =
      s.getMonth() === 0 && s.getDate() === 1 &&
      e.getMonth() === 11 && e.getDate() === 31 && sameYear;
    if (isFullYear) return `${s.getFullYear()}年`;
    const fmtD = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
    return sameYear
      ? `${s.getFullYear()} ${fmtD(s)}–${fmtD(e)}`
      : `${s.getFullYear()}/${s.getMonth() + 1}–${e.getFullYear()}/${e.getMonth() + 1}`;
  })();

  // ペース比較バー用のコンポーネント
  const PaceBar = ({ spent, budget, label, emoji }) => {
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    const capped = Math.min(pct, 100);
    const over = pct > 100;
    const barColor = over ? '#FF3B30' : pct > 90 ? '#FF9500' : pct > 70 ? '#FFCC00' : '#34C759';

    return (
      <div style={{ marginBottom: '18px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          marginBottom: '6px',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>{emoji}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#3C3C43' }}>{label}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '15px', fontWeight: 700, color: over ? '#FF3B30' : '#1C1C1E' }}>
            {fmt(spent)}
          </span>
          <span style={{ fontSize: '11px', color: '#8E8E93' }}>
            / {fmt(budget)}
          </span>
        </div>
        <div style={{
          height: '8px',
          background: '#F2F2F7',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            width: capped + '%',
            background: barColor,
            borderRadius: '4px',
            transition: 'width 0.5s ease-out',
          }} />
          {over && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: '4px',
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              fontSize: '9px',
              fontWeight: 700,
              color: '#FFFFFF',
            }}>
              +{(pct - 100).toFixed(0)}%
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F2F2F7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
      color: '#1C1C1E',
      paddingBottom: '90px',
    }}>
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="date"] {
          -webkit-appearance: none;
          appearance: none;
          min-width: 0;
          max-width: 100%;
        }
        input[type="date"]::-webkit-date-and-time-value {
          text-align: left;
          min-width: 0;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          margin-left: 4px;
        }
        button:active { opacity: 0.7; }
        .hidden-scroll::-webkit-scrollbar { display: none; }
        .hidden-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes fillUp {
          from { stroke-dashoffset: 283; }
        }
      `}</style>

      <header style={{
        background: '#FFFFFF',
        padding: '50px 20px 16px',
        borderBottom: '1px solid #E5E5EA',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            {activeTab === 'dashboard' && periodLabel}
            {activeTab === 'history' && '支出履歴'}
            {activeTab === 'settings' && '設定'}
          </h1>
          {activeTab === 'dashboard' && (
            <div style={{
              padding: '4px 10px',
              borderRadius: '100px',
              background: status.bg,
              color: status.color,
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {status.label}
            </div>
          )}
        </div>
      </header>

      {activeTab === 'dashboard' && (
        <div style={{ padding: '16px' }}>
          {/* メインカード */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '22px 20px',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '6px', fontWeight: 500 }}>
              期間内の残り予算
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: remaining < 0 ? '#FF3B30' : '#1C1C1E',
              marginBottom: '14px',
            }}>
              {fmt(remaining)}
            </div>

            <div style={{
              height: '10px',
              background: '#F2F2F7',
              borderRadius: '5px',
              overflow: 'hidden',
              position: 'relative',
              marginBottom: '10px',
            }}>
              <div style={{
                height: '100%',
                width: Math.min(usagePct, 100) + '%',
                background: pace > 10 ? '#FF3B30' : pace > 3 ? '#FF9500' : '#34C759',
                borderRadius: '5px',
                transition: 'width 0.4s',
              }} />
              {yearlyBudget > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -2,
                  bottom: -2,
                  left: `calc(${Math.min(expectedPct, 100)}% - 1px)`,
                  width: '2px',
                  background: '#1C1C1E',
                  opacity: 0.5,
                }} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8E8E93' }}>
              <span>{fmt(totalSpent)} 使用</span>
              <span>/ {fmt(yearlyBudget)}</span>
            </div>
            <div style={{
              fontSize: '11px',
              color: '#8E8E93',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #F2F2F7',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>経過 {daysPassed}日 / {totalPeriodDays}日</span>
              <span>残り {daysRemaining}日</span>
            </div>
          </div>

          {/* 今日の予算 - 遊び心のある円形ゲージ */}
          {yearlyBudget > 0 && !isBeforeStart && !isAfterEnd && (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '22px 20px',
              marginBottom: '12px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* 装飾背景 */}
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${todayMood.color}15 0%, transparent 70%)`,
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                position: 'relative',
              }}>
                {/* 円形ゲージ */}
                <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
                  <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="55"
                      cy="55"
                      r="45"
                      stroke="#F2F2F7"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="55"
                      cy="55"
                      r="45"
                      stroke={todayMood.color}
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset={
                        283 -
                        283 * Math.min(dailyRemainingBudget > 0 ? todaySpent / dailyRemainingBudget : 0, 1)
                      }
                      style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    animation: todaySpent > dailyRemainingBudget ? 'pulse 1.5s infinite' : 'none',
                  }}>
                    {todayMood.emoji}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 500, marginBottom: '2px' }}>
                    今日のお財布
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: todayMood.color,
                    marginBottom: '8px',
                  }}>
                    {todayMood.label}
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: todaySpent > dailyRemainingBudget ? '#FF3B30' : '#1C1C1E',
                    lineHeight: 1.1,
                  }}>
                    {fmt(todaySpent)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '4px' }}>
                    / 今日の予算 {fmt(Math.max(dailyRemainingBudget, 0))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 日/週/月のペース比較 */}
          {yearlyBudget > 0 && !isBeforeStart && (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '18px 20px',
              marginBottom: '12px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                ペース比較
              </div>
              <div style={{ fontSize: '11px', color: '#8E8E93', marginBottom: '16px' }}>
                残り予算を残り日数で割った、これから使える目安
              </div>

              <PaceBar
                spent={todaySpent}
                budget={Math.max(dailyRemainingBudget, 0)}
                label="今日"
                emoji="☀️"
              />
              <PaceBar
                spent={weekSpent}
                budget={Math.max(weeklyRemainingBudget, 0)}
                label="今週 (月曜〜)"
                emoji="📅"
              />
              <PaceBar
                spent={monthSpent}
                budget={Math.max(monthlyRemainingBudget, 0)}
                label="今月"
                emoji="🗓"
              />

              <div style={{
                marginTop: '6px',
                padding: '10px 12px',
                background: '#F9F9FB',
                borderRadius: '10px',
                fontSize: '11px',
                color: '#3C3C43',
                lineHeight: 1.6,
              }}>
                💡 予算ペース目安 · 日 {fmt(dailyBudget)} / 週 {fmt(weeklyBudget)} / 月 {fmt(monthlyBudget)}
              </div>
            </div>
          )}

          {/* 理想ペースとの差 */}
          {yearlyBudget > 0 && !isBeforeStart && (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '12px',
            }}>
              <div style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '6px', fontWeight: 500 }}>
                理想ペースとの差
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: diffFromIdeal > 0 ? '#FF3B30' : '#34C759',
              }}>
                {diffFromIdeal > 0 ? '+' : ''}{fmt(diffFromIdeal)}
              </div>
              <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '2px' }}>
                {diffFromIdeal > 0
                  ? `理想より ${fmt(diffFromIdeal)} 多く使っています`
                  : `理想より ${fmt(Math.abs(diffFromIdeal))} 節約できています`}
              </div>
            </div>
          )}

          {/* カテゴリ内訳 */}
          {totalSpent > 0 && (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '18px 20px',
              marginBottom: '12px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                カテゴリ別支出
              </div>
              {categories
                .filter((c) => spentByCategory[c.name] > 0)
                .sort((a, b) => spentByCategory[b.name] - spentByCategory[a.name])
                .map((cat) => {
                  const spent = spentByCategory[cat.name];
                  const pct = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
                  return (
                    <div key={cat.name} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '18px', marginRight: '8px' }}>{cat.icon}</span>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{cat.name}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{fmt(spent)}</span>
                      </div>
                      <div style={{ height: '6px', background: '#F2F2F7', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: pct + '%',
                          background: cat.color,
                          borderRadius: '3px',
                        }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* 月別支出 */}
          {periodMonths.length > 0 && (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '18px 20px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                月別支出
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '110px', position: 'relative' }}>
                {periodMonths.map((m) => {
                  const val = monthlyTotals[m.key] || 0;
                  const maxVal = Math.max(
                    ...Object.values(monthlyTotals),
                    monthlyBudget || 1
                  );
                  const h = (val / maxVal) * 100;
                  const over = monthlyBudget > 0 && val > monthlyBudget;
                  const isCurrentMonth =
                    m.year === today.getFullYear() && m.month === today.getMonth();
                  return (
                    <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                      <div style={{
                        height: h + '%',
                        background: over ? '#FF9500' : isCurrentMonth ? '#007AFF' : '#C7C7CC',
                        borderRadius: '4px 4px 0 0',
                        minHeight: val > 0 ? '3px' : '0',
                        transition: 'height 0.3s',
                      }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                {periodMonths.map((m) => {
                  const isCurrentMonth =
                    m.year === today.getFullYear() && m.month === today.getMonth();
                  return (
                    <div key={m.key} style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: '10px',
                      color: isCurrentMonth ? '#007AFF' : '#8E8E93',
                      fontWeight: isCurrentMonth ? 600 : 400,
                    }}>
                      {m.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <HistoryView
          periodExpenses={periodExpenses}
          categories={categories}
          fmt={fmt}
          deleteExpense={deleteExpense}
        />
      )}

      {activeTab === 'settings' && (
        <div style={{ padding: '16px' }}>
          {/* 予算 */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '10px', fontWeight: 500 }}>
              期間の支出目標
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: '4px',
            }}>
              {fmt(yearlyBudget)}
            </div>
            <div style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '16px' }}>
              {totalPeriodDays}日間 · 1日あたり {fmt(dailyBudget)}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                placeholder="新しい金額を入力"
                inputMode="numeric"
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  border: '1px solid #E5E5EA',
                  borderRadius: '10px',
                  fontSize: '16px',
                  background: '#F9F9FB',
                  color: '#1C1C1E',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={confirmBudget}
                disabled={!budgetDraft}
                style={{
                  padding: '12px 20px',
                  background: budgetDraft ? '#007AFF' : '#C7C7CC',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: budgetDraft ? 'pointer' : 'default',
                }}
              >
                更新
              </button>
            </div>
          </div>

          {/* 期間設定 */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '10px', fontWeight: 500 }}>
              対象期間
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
              {new Date(startDate).toLocaleDateString('ja-JP')} 〜 {new Date(endDate).toLocaleDateString('ja-JP')}
            </div>
            <div style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '16px' }}>
              年の途中からでも開始日を設定できます
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#8E8E93', display: 'block', marginBottom: '4px' }}>
                開始日
              </label>
              <input
                type="date"
                value={startDateDraft || startDate}
                onChange={(e) => setStartDateDraft(e.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '100%',
                  padding: '12px 14px',
                  border: '1px solid #E5E5EA',
                  borderRadius: '10px',
                  fontSize: '16px',
                  background: '#F9F9FB',
                  color: '#1C1C1E',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  minWidth: 0,
                }}
              />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#8E8E93', display: 'block', marginBottom: '4px' }}>
                終了日
              </label>
              <input
                type="date"
                value={endDateDraft || endDate}
                onChange={(e) => setEndDateDraft(e.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '100%',
                  padding: '12px 14px',
                  border: '1px solid #E5E5EA',
                  borderRadius: '10px',
                  fontSize: '16px',
                  background: '#F9F9FB',
                  color: '#1C1C1E',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  minWidth: 0,
                }}
              />
            </div>

            {/* クイック設定 */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setStartDateDraft(todayStr());
                  setEndDateDraft(`${currentYear}-12-31`);
                }}
                style={{
                  padding: '8px 12px',
                  background: '#F2F2F7',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#007AFF',
                  fontFamily: 'inherit',
                }}
              >
                今日から年末まで
              </button>
              <button
                onClick={() => {
                  setStartDateDraft(`${currentYear}-01-01`);
                  setEndDateDraft(`${currentYear}-12-31`);
                }}
                style={{
                  padding: '8px 12px',
                  background: '#F2F2F7',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#007AFF',
                  fontFamily: 'inherit',
                }}
              >
                今年まるごと
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  const start = todayStr();
                  d.setFullYear(d.getFullYear() + 1);
                  d.setDate(d.getDate() - 1);
                  setStartDateDraft(start);
                  setEndDateDraft(d.toISOString().slice(0, 10));
                }}
                style={{
                  padding: '8px 12px',
                  background: '#F2F2F7',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#007AFF',
                  fontFamily: 'inherit',
                }}
              >
                今日から1年
              </button>
            </div>

            <button
              onClick={confirmPeriod}
              disabled={!startDateDraft && !endDateDraft}
              style={{
                width: '100%',
                padding: '12px',
                background: (startDateDraft || endDateDraft) ? '#007AFF' : '#C7C7CC',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: (startDateDraft || endDateDraft) ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}
            >
              期間を更新
            </button>
          </div>

          {/* その他 */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '4px 0',
            marginBottom: '12px',
          }}>
            <div style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '15px' }}>記録数</span>
              <span style={{ fontSize: '15px', color: '#8E8E93' }}>{periodExpenses.length}件</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={openAddSheet}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          background: '#007AFF',
          color: '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(0, 122, 255, 0.4)',
          zIndex: 20,
        }}
      >
        <Plus size={26} />
      </button>

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#FFFFFF',
        borderTop: '1px solid #E5E5EA',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0 24px',
        zIndex: 15,
      }}>
        {[
          { id: 'dashboard', icon: Home, label: 'ホーム' },
          { id: 'history', icon: List, label: '履歴' },
          { id: 'settings', icon: Settings, label: '設定' },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: active ? '#007AFF' : '#8E8E93',
                padding: '4px 20px',
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span style={{ fontSize: '10px', fontWeight: active ? 600 : 500 }}>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {showAddSheet && (
        <div
          onClick={() => setShowAddSheet(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#F2F2F7',
              width: '100%',
              maxHeight: '92vh',
              borderRadius: '20px 20px 0 0',
              overflowY: 'auto',
              animation: 'slideUp 0.25s ease',
            }}
          >
            <div style={{
              position: 'sticky',
              top: 0,
              background: '#F2F2F7',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #E5E5EA',
              zIndex: 2,
            }}>
              <button
                onClick={() => setShowAddSheet(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007AFF',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '6px',
                  fontFamily: 'inherit',
                }}
              >
                キャンセル
              </button>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>支出を追加</div>
              <button
                onClick={confirmAddExpense}
                disabled={!expenseForm.amount || Number(expenseForm.amount) <= 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: (!expenseForm.amount || Number(expenseForm.amount) <= 0) ? '#C7C7CC' : '#007AFF',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px',
                  fontFamily: 'inherit',
                }}
              >
                保存
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '8px' }}>金額</div>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: '4px',
                }}>
                  <span style={{ fontSize: '28px', fontWeight: 600, color: '#8E8E93' }}>¥</span>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0"
                    autoFocus
                    inputMode="numeric"
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: '44px',
                      fontWeight: 700,
                      width: '220px',
                      textAlign: 'left',
                      background: 'transparent',
                      color: '#1C1C1E',
                      letterSpacing: '-0.02em',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '12px',
              }}>
                <div style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '12px' }}>カテゴリ</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px',
                }}>
                  {categories.map((cat) => {
                    const selected = expenseForm.category === cat.name;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => setExpenseForm({ ...expenseForm, category: cat.name })}
                        style={{
                          background: selected ? cat.color + '20' : '#F9F9FB',
                          border: selected ? `2px solid ${cat.color}` : '2px solid transparent',
                          borderRadius: '12px',
                          padding: '12px 4px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          fontFamily: 'inherit',
                        }}
                      >
                        <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: selected ? 600 : 500,
                          color: selected ? '#1C1C1E' : '#3C3C43',
                        }}>
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                overflow: 'hidden',
                marginBottom: '12px',
              }}>
                <div style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #F2F2F7',
                }}>
                  <span style={{ fontSize: '15px', flex: 1 }}>日付</span>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: '15px',
                      background: 'transparent',
                      color: '#007AFF',
                      textAlign: 'right',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <input
                    type="text"
                    value={expenseForm.memo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, memo: e.target.value })}
                    placeholder="メモ (任意)"
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: '15px',
                      width: '100%',
                      background: 'transparent',
                      color: '#1C1C1E',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
