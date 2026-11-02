import React, { ElementType } from 'react';
import { motion, MotionProps } from 'framer-motion';

export interface FadeInProps extends MotionProps {
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
  children?: React.ReactNode;
}

export const FadeIn: React.FC<FadeInProps> = ({
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className = '',
  style,
  as = 'div',
  children,
  ...rest
}) => {
  // Use motion.create if available, otherwise motion[as]
  const MotionComponent = (motion.create ? motion.create(as) : (motion as any)[as]) as any;

  const variants = {
    hidden: {
      opacity: 0,
      x,
      y,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '50px', amount: 0 }}
      variants={variants}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </MotionComponent>
  );
};
