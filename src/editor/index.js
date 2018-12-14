import Notifications, {notify} from 'react-notify-toast';
import { Editor } from 'slate-react';
import { Value, Block } from 'slate';
import React from 'react';
import { List } from 'immutable';

import EditorToolbar, { buttonTypes } from './editorToolbar';
import { Image } from './components';

// function print(val) {
//   console.log(JSON.stringify(val.toJS()));
// }
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
  constructor() {
    super();
    const initialValue = this.getInitialValue();
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
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  getInitialValue() {
    const existingValue = JSON.parse(localStorage.getItem('editorContent'));
    const initialValue = existingValue || emptyDocument;
    return Value.fromJSON(initialValue);
  }

  onChange({ value }) {
    this.setState({ value });
  }

  getClosestAncestor(document, path, type) {
    let nodes = document.nodes;
    let node = null;
    let pathPosition = -1;
    for(let i = 0; i < path.length; i++) {
      const index = path[i]
      const currentNode = nodes.get(index);
      if (currentNode.type === type) {
        node = currentNode;
        pathPosition = i;
      }
      nodes = currentNode.nodes;
    }
    const ret = { node, path: path.slice(0, pathPosition + 1) };
    return ret;
  }

  getNewListNode(listItem, listType) {
    const block = Block.create({
      type: listType,
      // nodes:[
      //   {
      //     object: 'text',
      //     leaves: [
      //       {
      //         text: '',
      //       },
      //     ],
      //   },
      //   listItem,
      // ]
    });
    return block;
  }

  indent(editor, path) {
    let { document } = editor.value;
    const {
      node: closestListItem,
      path: closestListItemPath
    } = this.getClosestAncestor(document, path, 'list-item');

    const sibling = document.getPreviousSibling(closestListItem.key);
    if (!sibling || sibling.type !== 'list-item') return;

    const lastIndex = sibling.nodes.size;
    const lastChild = sibling.nodes.last();

    const listType = document.getParent(sibling.key).type;

    if(lastChild && lastChild.type !==listType) {
      const newList = this.getNewListNode(null, listType);
      editor.insertNodeByKey(sibling.key, lastIndex, newList);
      console.log(closestListItem.key, newList.key);
      editor.moveNodeByKey(closestListItem.key, newList.key, 0);
    }
  }

  indent_(editor, path) {
    let { document } = editor.value;
    const {
      node: closestListItem,
      path: closestListItemPath
    } = this.getClosestAncestor(document, path, 'list-item');

    // console.log(JSON.stringify(closestListItemAncestor.toJS()), closestListItemPath);
    if (!closestListItem) return;
    if(closestListItem[closestListItem.length - 1] === 0) {
      console.log("no sibling");
      return;
    }
    const siblingPath = closestListItemPath.slice(0);
    siblingPath[siblingPath.length -1]--;
    const sibling = document.getNode(siblingPath);
    if (sibling.type !== 'list-item') {
      return;
    }

    const listType = this.getClosestAncestor(document, siblingPath, 'bulleted-list').node
      ? 'bulleted-list' : 'numbered-list';

    const siblingDesc = sibling.nodes.size;
    const lastSiblingDescPath = siblingPath.slice(0);
    lastSiblingDescPath.push(siblingDesc - 1);
    console.log(lastSiblingDescPath, siblingDesc, siblingPath);
    const lastSiblingDesc = document.getNode(lastSiblingDescPath);

    if (lastSiblingDesc.type !== listType) {
      const newListNode = this.getNewListNode(closestListItem.toJS(), listType);
      // print(newListNode);
      // print(sibling);
      console.log(closestListItemPath);
      editor.insertNodeByPath(siblingPath, siblingDesc, newListNode);
      editor.moveNodeByPath(List(closestListItemPath), newListNode.key, 0);
      // editor
      //   .insertNodeByPath(siblingPath, siblingDesc, newListNode);
    } else {

    }
    // const last = sibling.nodes.get(sibling.nodes.size() - 1);
    // if (last.type === listType) {
    //   editor.removeNodeByPath(closestListItemAncestor);
    //   editor.insertNodeByKey()
    // }
  }

  onKeyDown(event, editor, next) {
    if(event.key === 'Tab') {
      let focusPath = editor.value.selection.focus.path;
      focusPath = focusPath.toJS();
      this.indent(editor, focusPath);
    } else {
      next()
    }
    // next();
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

  hasBlock(type) {
    return this.state.value.blocks.some((node) => node.type === type);
  }

  onBlockButtonClick(type) {
    const { editor } = this
    const { value } = editor
    const { document } = value

    // Handle everything but list buttons.
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
      // Handle the extra wrapping required for list buttons.
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
          isSaveActive={true}
          handleClick={this.handleToolbarButtonClick}
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
