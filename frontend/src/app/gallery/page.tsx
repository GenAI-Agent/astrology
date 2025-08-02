'use client';

import { useState, useEffect } from 'react';
import styles from './gallery.module.css';

const textCards = [
  "歡迎來到星空藝廊，探索宇宙的奧秘",
  "每一顆星星都有自己的故事",
  "在浩瀚宇宙中，找到屬於你的那顆星",
  "星辰大海，等你來探索",
  "讓我們一起仰望星空，夢想無限"
];

export default function GalleryPage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % textCards.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      console.log('User input:', inputValue);
      setInputValue('');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.videoSection}>
        <video
          className={styles.video}
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/sample.mp4" type="video/mp4" />
          您的瀏覽器不支援視頻播放
        </video>
      </div>

      <div className={styles.carouselSection}>
        <div className={styles.carouselContainer}>
          {textCards.map((text, index) => (
            <div
              key={index}
              className={`${styles.card} ${
                index === currentCardIndex ? styles.active : ''
              }`}
            >
              <p>{text}</p>
            </div>
          ))}
        </div>
        <div className={styles.indicators}>
          {textCards.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${
                index === currentCardIndex ? styles.activeIndicator : ''
              }`}
              onClick={() => setCurrentCardIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.inputSection}>
        <form onSubmit={handleInputSubmit} className={styles.inputForm}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="留下您的想法或留言..."
            className={styles.input}
          />
          <button type="submit" className={styles.submitButton}>
            發送
          </button>
        </form>
      </div>
    </div>
  );
}