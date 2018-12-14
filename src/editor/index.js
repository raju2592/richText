import Notifications, {notify} from 'react-notify-toast';
import { Editor } from 'slate-react';
import { Value, Block } from 'slate';
import React from 'react';

import EditorToolbar, { buttonTypes } from './editorToolbar';
import { Image } from './components';

const emptyDocument = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: '',
              },
            ],
          },
        ],
      },
    ],
  },
});

const schema = {
  document: {
    last: { type: 'paragraph' },
    normalize: (editor, { code, node, child }) => {
      switch (code) {
        case 'last_child_type_invalid': {
          const paragraph = Block.create('paragraph')
          return editor.insertNodeByKey(node.key, node.nodes.size, paragraph)
        }
        default: 
          return;
      }
    },
  },
  blocks: {
    image: {
      isVoid: true,
    },
  },
};

const DEFAULT_NODE = 'paragraph'

class RichEditor extends React.Component {
  constructor(props) {
    super();
    const initialValue = this.getInitialValue();
    this.state = {
      value: initialValue,
      isSaveActive: true,
      blockNodeLimit: props.blockNodeLimit || -1, // -1 means no limit
    };
    this.ref = (editor) => {
      this.editor = editor;
    };
    this.notificationDuration = props.notificationDuration || 1500;
    this.onClickBlockNodeLimit = this.onClickBlockNodeLimit.bind(this);
    this.imageInputRef = React.createRef();
    this.onChange = this.onChange.bind(this);
    this.handleImageUpload = this.handleImageUpload.bind(this);
    this.handleToolbarButtonClick = this.handleToolbarButtonClick.bind(this);
    this.renderNode = this.renderNode.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  onClickBlockNodeLimit() {
    const newLimit = window.prompt('Enter the new limit:');
    const lim = parseInt(newLimit);
    if (lim > 0) this.setState({ blockNodeLimit: lim });
  }

  getInitialValue() {
    const existingValue = JSON.parse(localStorage.getItem('editorContent'));
    const initialValue = existingValue || emptyDocument;
    return Value.fromJSON(initialValue);
  }

  onChange({ value }) {
    const isSaveActive = this.state.blockNodeLimit === -1 
      || value.document.nodes.size <= this.state.blockNodeLimit;
    this.setState({ value, isSaveActive });
  }

  onKeyDown(event, editor, next) {
    const keyToMark = {
      b: 'bold',
      i: 'italic',
      u: 'underlined',
      '`': 'code',
    };

    if (!event.ctrlKey) return next();
    event.preventDefault();
    const mark = keyToMark[event.key];
    if (!mark) return;
    this.editor.toggleMark(mark);
  }

  saveContent() {
    const editorContent = JSON.stringify(this.state.value.toJSON());
    localStorage.setItem('editorContent', editorContent);
    notify.show('💾 saved ✔', 'success', this.notificationDuration);
  }

  restoreContent() {
    const initialValue = this.getInitialValue();
    this.setState({ value: initialValue });
    notify.show('restored saved content ✔', 'success', this.notificationDuration);
  }

  insertImage(src) {
    this.editor.insertBlock({
      type: 'image',
      data: { src },
    });
  }

  handleImageUpload() {
    const [file] = this.imageInputRef.current.files;
    const fileReader = new FileReader();
    
    fileReader.onload = (event) => {
      const src = event.target.result;
      this.insertImage(src);
      notify.show('uploaded ✔', 'success', this.notificationDuration);
    };

    fileReader.onerror = () => {
      notify.show('error uploading', 'error', this.notificationDuration);
    };

    fileReader.readAsDataURL(file);
  }

  hasBlock(type) {
    return this.state.value.blocks.some((node) => node.type === type);
  }

  onBlockButtonClick(type) {
    const { editor } = this
    const { value } = editor
    const { document } = value


    if (type !== 'bulleted-list' && type !== 'numbered-list') {
      const isActive = this.hasBlock(type)
      const isList = this.hasBlock('list-item')

      if (isList) {
        editor
          .setBlocks(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list')
      } else {
        editor.setBlocks(isActive ? DEFAULT_NODE : type)
      }
    } else {
      const isList = this.hasBlock('list-item')
      const isType = value.blocks.some(block => {
        return !!document.getClosest(block.key, parent => parent.type === type)
      })

      if (isList && isType) {
        editor
          .setBlocks(DEFAULT_NODE)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list')
      } else if (isList) {
        editor
          .unwrapBlock(
            type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
          )
          .wrapBlock(type)
      } else {
        editor.setBlocks('list-item').wrapBlock(type)
      }
    }
  }

  handleToolbarButtonClick(event, buttonDetails) {
    event.preventDefault();
    const buttonType = buttonDetails.buttonType;
    switch (buttonType) {
      case buttonTypes.save:
        this.saveContent();
        break;

      case buttonTypes.cancel:
        this.restoreContent();
        break;

      case buttonTypes.imageUpload:
        this.imageInputRef.current.click();
        break;

      case buttonTypes.imageLink:
        const src = window.prompt('Enter the URL of the image:')
        if (!src) return;
        this.insertImage(src);
        break;

      case buttonTypes.block:
        this.onBlockButtonClick(buttonDetails.blockType);
        break;
      
      case buttonTypes.mark:
        this.editor.toggleMark(buttonDetails.markType);
        break;
      
      default:
    }
  }

  renderMark = (props, editor, next) => {
    const { children, mark, attributes } = props

    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{children}</strong>
      case 'code':
        return <code {...attributes}>{children}</code>
      case 'italic':
        return <em {...attributes}>{children}</em>
      case 'underlined':
        return <u {...attributes}>{children}</u>
      default:
        return next()
    }
  }

  renderNode = (props, editor, next) => {
    const { attributes, node, isFocused, children } = props

    switch (node.type) {
      case 'image': {
        const src = node.data.get('src')
        return <Image src={src} selected={isFocused} {...attributes} />
      }
      case 'block-quote':
        return <blockquote {...attributes}>{children}</blockquote>
      case 'heading-one':
        return <h1 {...attributes}>{children}</h1>
      case 'heading-two':
        return <h2 {...attributes}>{children}</h2>
      case 'list-item':
        return <li {...attributes}>{children}</li>
      case 'bulleted-list':
        return <ul {...attributes}>{children}</ul>
      case 'numbered-list':
        return <ol {...attributes}>{children}</ol>
      default: {
        return next()
      }
    }
  }

  render() {
    return (
      <div>
        <Notifications/>
        <EditorToolbar
          activeMarks={this.state.value.activeMarks}
          document={this.state.value.document}
          blocks={this.state.value.blocks}
          blockNodeLimit={this.state.blockNodeLimit}
          isSaveActive={this.state.isSaveActive}
          handleClick={this.handleToolbarButtonClick}
          onClickBlockNodeLimit={this.onClickBlockNodeLimit}
        />

        <Editor
          autoFocus
          placeholder="Enter some rich text..."
          ref={this.ref}
          schema={schema}
          value={this.state.value}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          renderMark={this.renderMark}
          renderNode={this.renderNode}
          readOnly={this.readOnly}
        />
        <input 
          ref={this.imageInputRef}
          type="file"
          accept="image/*"
          style={{display:"none"}}
          onChange={this.handleImageUpload}
        />
      </div>
    )
  }

}

export default RichEditor;
