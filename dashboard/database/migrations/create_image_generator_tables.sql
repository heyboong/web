-- Create image_templates table for storing image generator templates
CREATE TABLE IF NOT EXISTS image_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(500),
    background_image VARCHAR(500),
    canvas_width INT DEFAULT 800,
    canvas_height INT DEFAULT 600,
    price DECIMAL(10,2) DEFAULT 0.00,
    usage_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_is_public (is_public),
    INDEX idx_is_active (is_active),
    INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create image_template_layers table for storing text layers and image layers
CREATE TABLE IF NOT EXISTS image_template_layers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    layer_type ENUM('text', 'image') NOT NULL DEFAULT 'text',
    layer_name VARCHAR(255) NOT NULL,
    content TEXT, -- For text layers: the text content
    image_url VARCHAR(500), -- For image layers: the image URL
    position_x INT DEFAULT 0,
    position_y INT DEFAULT 0,
    width INT DEFAULT 200,
    height INT DEFAULT 50,
    rotation DECIMAL(5,2) DEFAULT 0,
    opacity DECIMAL(3,2) DEFAULT 1.00,
    z_index INT DEFAULT 1,
    
    -- Text-specific properties
    font_family VARCHAR(255) DEFAULT 'Arial',
    font_size INT DEFAULT 16,
    font_weight VARCHAR(20) DEFAULT 'normal',
    font_style VARCHAR(20) DEFAULT 'normal',
    text_color VARCHAR(7) DEFAULT '#000000',
    text_align ENUM('left', 'center', 'right', 'justify') DEFAULT 'left',
    
    -- Effects
    has_shadow BOOLEAN DEFAULT FALSE,
    shadow_color VARCHAR(7) DEFAULT '#000000',
    shadow_offset_x INT DEFAULT 2,
    shadow_offset_y INT DEFAULT 2,
    shadow_blur INT DEFAULT 4,
    
    has_outer_glow BOOLEAN DEFAULT FALSE,
    glow_color VARCHAR(7) DEFAULT '#ffffff',
    glow_size INT DEFAULT 5,
    
    -- Customizable fields (for users using the template)
    is_text_editable BOOLEAN DEFAULT TRUE,
    is_position_locked BOOLEAN DEFAULT FALSE,
    is_style_locked BOOLEAN DEFAULT FALSE,
    
    layer_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES image_templates(id) ON DELETE CASCADE,
    INDEX idx_template_id (template_id),
    INDEX idx_layer_type (layer_type),
    INDEX idx_z_index (z_index),
    INDEX idx_layer_order (layer_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create image_generator_usage table for tracking template usage and payments
CREATE TABLE IF NOT EXISTS image_generator_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    template_id INT NOT NULL,
    template_owner_id INT NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    generated_image_url VARCHAR(500),
    usage_data JSON, -- Store the customized data (text content, images, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES image_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (template_owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_template_id (template_id),
    INDEX idx_template_owner_id (template_owner_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_fonts table for storing user-uploaded fonts
CREATE TABLE IF NOT EXISTS user_fonts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    font_name VARCHAR(255) NOT NULL,
    font_family VARCHAR(255) NOT NULL,
    font_file_url VARCHAR(500) NOT NULL,
    font_format ENUM('ttf', 'otf', 'woff', 'woff2') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_font_family (font_family),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
