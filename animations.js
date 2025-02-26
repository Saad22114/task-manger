/**
 * Enhanced Animation System for Al-Murooj Task Management
 * This file contains advanced animation functions to improve user experience
 */

// Animation Configuration
const AnimConfig = {
    duration: {
        short: 200,
        medium: 300,
        long: 500,
        extraLong: 800
    },
    easing: {
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
        inOut: 'cubic-bezier(0.42, 0, 0.58, 1)'
    }
};

// Page load animations
class PageAnimator {
    constructor() {
        this.animatePageLoad();
        this.setupScrollAnimations();
    }

    animatePageLoad() {
        const header = document.querySelector('header');
        const taskInput = document.querySelector('.task-input');
        const toolbar = document.querySelector('.toolbar');
        const filters = document.querySelector('.filters');

        if (!header || !taskInput || !toolbar || !filters) return;

        // Stagger animations
        header.style.opacity = '0';
        taskInput.style.opacity = '0';
        toolbar.style.opacity = '0';
        filters.style.opacity = '0';

        header.style.transform = 'translateY(-20px)';
        taskInput.style.transform = 'translateY(20px)';
        toolbar.style.transform = 'translateY(20px)';
        filters.style.transform = 'translateY(20px)';

        // Ensure all elements have transitions
        [header, taskInput, toolbar, filters].forEach(el => {
            el.style.transition = `all ${AnimConfig.duration.medium}ms ${AnimConfig.easing.bounce}`;
        });

        // Animate in sequence
        setTimeout(() => {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }, 100);

        setTimeout(() => {
            filters.style.opacity = '1';
            filters.style.transform = 'translateY(0)';
        }, 200);

        setTimeout(() => {
            taskInput.style.opacity = '1';
            taskInput.style.transform = 'translateY(0)';
        }, 300);

        setTimeout(() => {
            toolbar.style.opacity = '1';
            toolbar.style.transform = 'translateY(0)';
        }, 400);
    }

    setupScrollAnimations() {
        // Identify if we need to animate on scroll
        const animateOnScroll = document.querySelectorAll('.animate-on-scroll');
        if (!animateOnScroll.length) return;

        // Add initial styles
        animateOnScroll.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `all ${AnimConfig.duration.medium}ms ${AnimConfig.easing.smooth}`;
        });

        // Handle scroll animation
        const handleScroll = () => {
            animateOnScroll.forEach(el => {
                const rect = el.getBoundingClientRect();
                const isInView = rect.top <= window.innerHeight * 0.8;
                
                if (isInView) {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }
            });
        };

        // Add scroll listener
        window.addEventListener('scroll', handleScroll);
        
        // Initial check
        handleScroll();
    }
}

// Card animations
class CardAnimator {
    constructor() {
        this.setupTaskCardAnimations();
    }

    setupTaskCardAnimations() {
        // We'll attach these animations when cards are created
        document.addEventListener('taskCardCreated', (e) => {
            const card = e.detail.card;
            if (!card) return;
            
            this.animateCardEntry(card, e.detail.index || 0);
        });

        // Listen for status changes
        document.addEventListener('taskStatusChanged', (e) => {
            const card = e.detail.card;
            if (!card) return;
            
            this.animateStatusChange(card, e.detail.oldStatus, e.detail.newStatus);
        });
    }

    animateCardEntry(card, index) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8) translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = `all ${AnimConfig.duration.medium}ms ${AnimConfig.easing.bounce}`;
            card.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
        }, 50 * index); // Stagger based on position
    }

    animateStatusChange(card, oldStatus, newStatus) {
        // Add visual feedback for status change
        card.style.transition = `all ${AnimConfig.duration.medium}ms ${AnimConfig.easing.elastic}`;
        
        // Create status change animation
        card.classList.add('status-changing');
        card.style.transform = 'scale(1.05)';
        
        setTimeout(() => {
            card.classList.remove('status-changing');
            card.style.transform = 'scale(1)';
        }, AnimConfig.duration.medium);
    }

    removeCard(card) {
        card.style.transition = `all ${AnimConfig.duration.medium}ms ${AnimConfig.easing.smooth}`;
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8) translateY(-20px)';
        
        return new Promise(resolve => {
            setTimeout(() => {
                card.remove();
                resolve();
            }, AnimConfig.duration.medium);
        });
    }
}

// Button animations
class ButtonAnimator {
    constructor() {
        this.setupButtonEffects();
    }

    setupButtonEffects() {
        // Add ripple effect to all buttons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.createRipple(e, button);
            });
        });
    }

    createRipple(event, button) {
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        // Calculate position
        const rect = button.getBoundingClientRect();
        const left = event.clientX - rect.left - radius;
        const top = event.clientY - rect.top - radius;

        // Style the ripple
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${left}px`;
        circle.style.top = `${top}px`;
        circle.classList.add('ripple');

        // Remove existing ripples
        const ripple = button.querySelector('.ripple');
        if (ripple) {
            ripple.remove();
        }

        // Add new ripple
        button.appendChild(circle);

        // Remove after animation completes
        setTimeout(() => {
            circle.remove();
        }, 600);
    }
}

// Form animations
class FormAnimator {
    constructor() {
        this.setupFormAnimations();
    }

    setupFormAnimations() {
        // Enhance form inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Add focus animations
            input.addEventListener('focus', () => {
                input.parentNode.classList.add('input-focused');
            });
            
            input.addEventListener('blur', () => {
                input.parentNode.classList.remove('input-focused');
            });
        });

        // Enhance template selection
        const templateButtons = document.querySelectorAll('.template-btn');
        templateButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                templateButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                // Animate form fields to show they're updated
                setTimeout(() => {
                    document.getElementById('taskTitle').classList.add('field-updated');
                    document.getElementById('taskDescription').classList.add('field-updated');
                    
                    setTimeout(() => {
                        document.getElementById('taskTitle').classList.remove('field-updated');
                        document.getElementById('taskDescription').classList.remove('field-updated');
                    }, 600);
                }, 100);
            });
        });
    }
}

// Notification animations
class NotificationAnimator {
    constructor() {
        this.setupNotificationEffects();
    }

    setupNotificationEffects() {
        // Listen for notification events
        document.addEventListener('notificationShow', (e) => {
            const notification = e.detail.notification;
            if (!notification) return;
            
            this.animateNotificationEntry(notification, e.detail.type);
        });
    }

    animateNotificationEntry(notification, type) {
        // Initial state
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(50px)';
        
        // Different animation based on notification type
        let delay = 0;
        switch (type) {
            case 'error':
                delay = 0; // Show errors immediately
                break;
            case 'success':
                delay = 100; // Slight delay for success
                break;
            default:
                delay = 100;
        }
        
        setTimeout(() => {
            notification.style.transition = `all ${AnimConfig.duration.medium}ms ${AnimConfig.easing.elastic}`;
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, delay);
    }
}

// Login form animations
class LoginAnimator {
    constructor() {
        this.setupLoginAnimation();
    }

    setupLoginAnimation() {
        const loginModal = document.getElementById('loginModal');
        if (!loginModal) return;
        
        // Animate login container
        const container = loginModal.querySelector('.login-container');
        if (container) {
            this.animateLoginContainer(container);
        }
    }

    animateLoginContainer(container) {
        // Initial styles
        container.style.opacity = '0';
        container.style.transform = 'scale(0.8)';
        
        // Animate in
        setTimeout(() => {
            container.style.transition = `all ${AnimConfig.duration.long}ms ${AnimConfig.easing.bounce}`;
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
        }, 100);

        // Animate children elements
        const logo = container.querySelector('.login-logo');
        const form = container.querySelector('.login-form');
        const footer = container.querySelector('.login-footer');
        
        if (logo) {
            logo.style.opacity = '0';
            logo.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                logo.style.transition = `all ${AnimConfig.duration.medium}ms ${AnimConfig.easing.bounce}`;
                logo.style.opacity = '1';
                logo.style.transform = 'translateY(0)';
            }, 300);
        }
        
        if (form) {
            const inputs = form.querySelectorAll('input');
            const button = form.querySelector('button');
            
            inputs.forEach((input, i) => {
                input.style.opacity = '0';
                input.style.transform = 'translateX(-20px)';
                
                setTimeout(() => {
                    input.style.transition = `all ${AnimConfig.duration.medium}ms ${AnimConfig.easing.smooth}`;
                    input.style.opacity = '1';
                    input.style.transform = 'translateX(0)';
                }, 500 + (i * 100));
            });
            
            if (button) {
                button.style.opacity = '0';
                button.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    button.style.transition = `all ${AnimConfig.duration.medium}ms ${AnimConfig.easing.bounce}`;
                    button.style.opacity = '1';
                    button.style.transform = 'translateY(0)';
                }, 800);
            }
        }
        
        if (footer) {
            footer.style.opacity = '0';
            
            setTimeout(() => {
                footer.style.transition = `all ${AnimConfig.duration.medium}ms ease`;
                footer.style.opacity = '0.7';
            }, 1000);
        }
    }
}

// Chart animations
class ChartAnimator {
    constructor() {
        this.setupChartAnimation();
    }

    setupChartAnimation() {
        // Monitor for statistics popup
        document.addEventListener('statisticsShown', (e) => {
            const chart = e.detail.chartElement;
            if (!chart) return;
            
            this.animateChart(chart);
        });
    }

    animateChart(chartElement) {
        // Add animation to Chart.js
        if (window.Chart) {
            Chart.defaults.animation = {
                duration: AnimConfig.duration.extraLong,
                easing: 'easeOutQuart',
            };
        }
    }
}

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add animation CSS
    const animStyles = document.createElement('style');
    animStyles.textContent = `
        .ripple {
            position: absolute;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: rippleEffect 600ms ease-out;
            pointer-events: none;
        }
        
        @keyframes rippleEffect {
            to {
                transform: scale(3);
                opacity: 0;
            }
        }
        
        .status-changing {
            animation: statusChange 300ms ease;
        }
        
        @keyframes statusChange {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .input-focused {
            position: relative;
        }
        
        .input-focused::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--confirm-color);
            transform: scaleX(0);
            transition: transform 250ms ease-out;
            transform-origin: center;
        }
        
        .input-focused.active::after {
            transform: scaleX(1);
        }
        
        .field-updated {
            animation: flashField 600ms ease;
        }
        
        @keyframes flashField {
            0% { background-color: transparent; }
            50% { background-color: rgba(46, 204, 113, 0.1); }
            100% { background-color: transparent; }
        }
        
        .template-btn.selected {
            background-color: var(--button-color);
            color: white;
            transform: translateY(-3px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(animStyles);

    // Start animations with slight delay to ensure DOM is fully loaded
    setTimeout(() => {
        window.pageAnimator = new PageAnimator();
        window.cardAnimator = new CardAnimator();
        window.buttonAnimator = new ButtonAnimator();
        window.formAnimator = new FormAnimator();
        window.notificationAnimator = new NotificationAnimator();
        window.loginAnimator = new LoginAnimator();
        window.chartAnimator = new ChartAnimator();
        
        console.log('Animation system initialized');
    }, 100);
});

// Custom events for animations
class AnimationEvents {
    static fireTaskCardCreated(card, index) {
        card.dispatchEvent(new CustomEvent('taskCardCreated', {
            bubbles: true,
            detail: { card, index }
        }));
    }
    
    static fireTaskStatusChanged(card, oldStatus, newStatus) {
        card.dispatchEvent(new CustomEvent('taskStatusChanged', {
            bubbles: true,
            detail: { card, oldStatus, newStatus }
        }));
    }
    
    static fireNotificationShow(notification, type) {
        notification.dispatchEvent(new CustomEvent('notificationShow', {
            bubbles: true,
            detail: { notification, type }
        }));
    }
    
    static fireStatisticsShown(chartElement) {
        document.dispatchEvent(new CustomEvent('statisticsShown', {
            bubbles: true,
            detail: { chartElement }
        }));
    }
}