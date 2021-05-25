import React, {useState} from 'react'
import { Typography, Button, Form, Input} from 'antd';
import BannerUpload from '../../util/BannerUpload';
import axios from 'axios';
//import { response } from 'express';

const { TextArea } = Input;

const BannerParts = [
    {key:1, value: "공지사항"},
    {key:2, value: "이벤트"}
]
function UploadBannerPage(props) {

    const [Title, setTitle] = useState("")
    const [Contents, setContents] = useState("")
    const [BannerPart, setBannerPart] = useState("")
    const [Images, setImages] = useState([])

    const titleChangeHandler = (event) => {
        setTitle(event.currentTarget.value)
    }

    const contentsChangeHandler = (event) => {
        setContents(event.currentTarget.value)
    }
    
    const partsChangeHandler = (event) => {
        setBannerPart(event.currentTarget.value)
    }

    const uploadImages = (newIamges) => {
        setImages(newIamges)
    }
    
    const submitHandler = (event) => {
        // 확인을 누를 떄 자동으로 리프레쉬 안되게
        event.preventDefault();


        // 서버에 값들을 request
        const body = {
            title: Title,
            contents: Contents,
            images: Images,
            bannerPart: BannerPart
        }

        if(Title.length < 4) {
            return alert("정말 제목이 4글자 조차 안되나요?")
        }

        if(Images.length == 0 || !Title || !Contents || !BannerPart) {
            return alert("값을 모두 채워주세요")
        }
        axios.post("/api/bannerPost", body)
            .then(response => {
                if(response.data.success){
                    alert("배너 업로드 성공")
                    props.history.push('/')
                } else {
                    alert("배너 업로드 실패")
                }
            })
    }

    return (
        <div style={{maxWidth: '700px', margin: '2rem auto'}}>
            <div style={{textAlign: 'center', marginBottom: '2rem'}}>
                <h2>배너 업로드</h2>
            </div>

            <Form onSubmit={submitHandler}>

                {/*dropzone*/}
                <BannerUpload refreshFunction={uploadImages}/>

                <br />
                <br />
                <label>제목</label>
                <Input onChange={titleChangeHandler} value={Title}/>
                <br />
                <br />
                <label>내용</label>
                <TextArea onChange={contentsChangeHandler} value={Contents}/>
                <br />
                <br />
                <select onChange={partsChangeHandler} value={BannerPart}>
                    {BannerParts.map(item => (
                        <option key={item.key} value={item.key}>{item.value}</option> 
                    ))}
                </select>
                <br />
                <br />
                <Button htmlType="submit" onClick={submitHandler}>Submit</Button>
            </Form>

        </div>
    )
}

export default UploadBannerPage