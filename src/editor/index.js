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

class RichEditor extends React.Component {
  constructor() {
    super();
    const initialValue = this.getInitialValue();
    console.log('initial value is ..', initialValue);
    this.state = {
      value: initialValue,
    };
    this.ref = (editor) => {
      this.editor = editor;
    };
    this.readOnly = false;
    this.notificationDuration = 1500;
    this.imageInputRef = React.createRef();
    this.onChange = this.onChange.bind(this);
    this.handleImageUpload = this.handleImageUpload.bind(this);
    this.handleToolbarButtonClick = this.handleToolbarButtonClick.bind(this);
    this.renderNode = this.renderNode.bind(this);
  }

  getInitialValue() {
    const existingValue = JSON.parse(localStorage.getItem('editorContent'));
    const initialValue = existingValue || emptyDocument;
    return Value.fromJSON(initialValue);
  }

  onChange({ value }) {
    this.setState({ value });
  }

  saveContent() {
    const editorContent = JSON.stringify(this.state.value.toJSON());
    localStorage.setItem('editorContent', editorContent);
    notify.show('💾 saved ✔', 'success');
  }

  restoreContent() {
    const initialValue = this.getInitialValue();
    this.setState({ value: initialValue });
    notify.show('restored saved content ✔', 'success');
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

  handleToolbarButtonClick(event, buttonDetails) {
    const buttonType = buttonDetails.buttonType;
    if (buttonType === buttonTypes.save) {
      this.saveContent();
    } else if (buttonType === buttonTypes.cancel) {
      this.restoreContent();
    } else if (buttonType === buttonTypes.imageUpload) {
      this.imageInputRef.current.click();
    } else if (buttonType === buttonTypes.imageLink) {
      const src = window.prompt('Enter the URL of the image:')
      if (!src) return
      this.insertImage(src);
    }
  }

  renderNode = (props, editor, next) => {
    const { attributes, node, isFocused } = props

    switch (node.type) {
      case 'image': {
        console.log(attributes);
        const src = node.data.get('src')
        return <Image src={src} selected={isFocused} {...attributes} />
      }

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
          blocks={this.state.value.blocks}
          isSaveActive={true}
          handleClick={this.handleToolbarButtonClick}
        />

        <Editor
          spellCheck
          autoFocus
          placeholder="Enter some rich text..."
          ref={this.ref}
          schema={schema}
          value={this.state.value}
          onChange={this.onChange}
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
