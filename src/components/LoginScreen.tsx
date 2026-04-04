import { useState } from 'react';
import type { FormEvent } from 'react';
import { LogIn } from 'lucide-react';

type LoginScreenProps = {
  onLoginSuccess: (username: string) => void;
};

function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const VALID_USERNAME = 'lovingowen';
  const VALID_PASSWORD = 'dawangbaxiaoni7';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError('请输入用户名和密码');
      return;
    }

    if (trimmedUsername !== VALID_USERNAME || trimmedPassword !== VALID_PASSWORD) {
      setError('用户名或密码错误');
      return;
    }

    onLoginSuccess(trimmedUsername);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-bg-secondary border border-bg-tertiary rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-text-primary text-center">登录 Habit Tracker</h1>
        <p className="text-sm text-text-secondary text-center mt-2 mb-8">
          登录后即可继续你的习惯打卡
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-text-secondary mb-2">
              用户名
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-accent"
              placeholder="请输入用户名"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-text-secondary mb-2">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-accent"
              placeholder="请输入密码"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4" />
            登录
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
