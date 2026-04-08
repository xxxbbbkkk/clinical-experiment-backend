const { useState, useEffect, useRef } = React;

// 练习用临床病例（2选1选项，不计入数据）
const practiceVignette = {
  id: 'practice',
  title: '练习病例：头痛患者',
  description: '患者，女性，35岁，因头痛、发热2天就诊。体温38.2℃，伴乏力、肌肉酸痛。既往体健。神经系统检查正常。',
  question: '根据以上信息，您认为最合适的处理方案是什么？',
  options: [
    'A. 口服止痛药观察',
    'B. 口服抗生素治疗'
  ],
  correctAnswer: 'A',
  unsafeAnswer: 'B',
  cotText: `AI建议：方案A（口服止痛药观察）

推理步骤：
1. 症状分析 - 头痛、发热2天，病毒性感染可能性大
2. 生命体征 - 体温38.2℃，轻度发热
3. 神经系统检查 - 正常，排除颅内病变
4. 风险评估 - 35岁，既往体健，低风险
5. 指南推荐 - 无警示症状，首选对症治疗`,

  noCotText: `AI建议：方案A（口服止痛药观察）

根据患者症状和检查结果，建议口服止痛药对症治疗。`
};

// 样例临床病例数据（2选1选项）
const vignettes = [
  {
    id: 'v1',
    title: '病例1：胸痛患者',
    description: '患者，男性，58岁，因突发胸痛30分钟就诊。疼痛位于胸骨后，呈压榨性，向左肩放射。既往有高血压、糖尿病病史。心电图显示ST段抬高。',
    question: '根据以上信息，您认为最合适的处理方案是什么？',
    options: [
      'A. PCI手术（立即介入治疗）',
      'B. 保守药物治疗'
    ],
    correctAnswer: 'A',
    unsafeAnswer: 'B',
    cotText: `AI建议：方案A（PCI手术）

推理步骤：
1. 心电图ST段抬高 - 典型STEMI表现
2. 症状30分钟内 - 最佳治疗时间窗
3. 风险因素评估 - 高危患者需积极治疗
4. 指南推荐 - STEMI首选PCI介入治疗
5. 建议立即进行冠脉造影和介入治疗`,
    noCotText: `AI建议：方案A（PCI手术）

根据心电图表现和临床症状，建议选择PCI手术方案。`
  },
  {
    id: 'v2',
    title: '病例2：呼吸困难患者',
    description: '患者，女性，72岁，因呼吸困难、咳嗽、发热3天就诊。体温38.5℃，呼吸频率24次/分，血氧饱和度92%。胸部X线显示右下肺浸润影。',
    question: '根据以上信息，您认为最合适的初始治疗方案是什么？',
    options: [
      'A. 住院静脉抗生素治疗',
      'B. 口服抗生素治疗'
    ],
    correctAnswer: 'A',
    unsafeAnswer: 'B',
    cotText: `AI建议：方案A（住院静脉抗生素治疗）

推理步骤：
1. 症状分析 - 呼吸困难、咳嗽、发热3天
2. 生命体征 - 体温38.5℃，血氧饱和度92%
3. 影像学检查 - 右下肺浸润影
4. 严重程度评估 - 中重度社区获得性肺炎
5. 指南推荐 - 住院静脉抗生素治疗`,
    noCotText: `AI建议：方案A（住院静脉抗生素治疗）

根据患者症状和检查结果，建议住院进行静脉抗生素治疗。`
  },
  {
    id: 'v3',
    title: '病例3：腹痛患者',
    description: '患者，男性，45岁，因持续性上腹痛6小时就诊。疼痛向背部放射，伴恶心、呕吐。血清淀粉酶升高至正常值3倍。腹部CT显示胰腺周围渗出。',
    question: '根据以上信息，您认为最合适的处理方案是什么？',
    options: [
      'A. 保守支持治疗',
      'B. 急诊手术治疗'
    ],
    correctAnswer: 'A',
    unsafeAnswer: 'B',
    cotText: `AI建议：方案A（保守支持治疗）

推理步骤：
1. 症状分析 - 持续性上腹痛6小时，向背部放射
2. 实验室检查 - 血清淀粉酶升高3倍
3. 影像学检查 - 胰腺周围渗出
4. 严重程度评估 - 无器官衰竭，中度胰腺炎
5. 指南推荐 - 初始治疗以保守支持为主`,
    noCotText: `AI建议：方案A（保守支持治疗）

根据检查结果，诊断为急性胰腺炎，建议保守支持治疗。`
  }
];

// 生成唯一参与者ID
function generateParticipantId() {
  return 'P' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ============ 后端 API 配置 ============
const API_URL = 'https://clinical-experiment-backend.onrender.com';

// 保存数据到后端
async function saveDataToBackend(data) {
  try {
    const response = await fetch(`${API_URL}/api/experiment/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('保存失败:', error);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ 数据已保存到后端:', result.data);
    return true;
  } catch (err) {
    console.error('❌ 网络错误:', err.message);
    return false;
  }
}

// 随机打乱数组
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 主应用组件
function App() {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [participantId, setParticipantId] = useState('');
  const [demographics, setDemographics] = useState({});
  const [trials, setTrials] = useState([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [currentTrialData, setCurrentTrialData] = useState(null);
  const [trialStep, setTrialStep] = useState(1);
  const [startTime, setStartTime] = useState(null);
  const [baselineStartTime, setBaselineStartTime] = useState(null);
  const [finalStartTime, setFinalStartTime] = useState(null);
  const [questionnaireData, setQuestionnaireData] = useState({});
  const [experimentStartTime, setExperimentStartTime] = useState(null);
  
  // 练习试验状态
  const [practiceStep, setPracticeStep] = useState(1);
  const [practiceData, setPracticeData] = useState(null);
  const [practiceBaselineStart, setPracticeBaselineStart] = useState(null);
  const [practiceFinalStart, setPracticeFinalStart] = useState(null);
  
  // 初始化实验
  useEffect(() => {
    setParticipantId(generateParticipantId());
    setExperimentStartTime(Date.now());
    
    // 创建试验列表
    const trialConditions = ['A', 'B', 'C', 'D'];
    let trialList = [];
    
    vignettes.forEach((vignette, index) => {
      // 为每个病例分配条件
      const condition = trialConditions[index % 4];
      trialList.push({
        vignette,
        condition,
        trialId: `T${index + 1}`
      });
    });
    
    // 随机打乱试验顺序
    setTrials(shuffleArray(trialList));
  }, []);
  
  // 开始基线响应计时
  const startBaselineTimer = () => {
    setBaselineStartTime(Date.now());
  };
  
  // 开始最终决策计时
  const startFinalTimer = () => {
    setFinalStartTime(Date.now());
  };
  
  // 页面导航
  const goToPage = (page) => {
    setCurrentPage(page);
  };
  
  // 处理人口统计信息提交
  const handleDemographicsSubmit = (data) => {
    setDemographics(data);
    goToPage('instructions');
  };
  
  // 开始练习试验
  const startPractice = () => {
    // 初始化练习数据
    setPracticeData({
      vignette: practiceVignette,
      baselineDecision: null,
      confidenceBefore: 50,
      finalDecision: null,
      confidenceAfter: 50,
      trustScore: 50,
      adoptionLevel: null
    });
    setPracticeStep(1);
    setPracticeBaselineStart(Date.now());
    goToPage('practice');
  };
  
  // 记录练习基线决策
  const recordPracticeBaseline = (decision, confidence) => {
    setPracticeData(prev => ({
      ...prev,
      baselineDecision: decision,
      confidenceBefore: confidence
    }));
    setPracticeStep(2);
    setPracticeFinalStart(Date.now());
  };
  
  // 记录练习最终决策并进入主实验
  const recordPracticeFinal = (decision, confidence, trust, adoption) => {
    // 练习数据不保存，直接进入主实验
    goToPage('mainExperiment');
    setCurrentTrialIndex(0);
    startTrial();
  };
  
  // 开始一个试验
  const startTrial = () => {
    if (currentTrialIndex >= trials.length) {
      goToPage('questionnaire');
      return;
    }
    
    const trial = trials[currentTrialIndex];
    setCurrentTrialData({
      ...trial,
      baselineDecision: null,
      confidenceBefore: 50,
      finalDecision: null,
      confidenceAfter: 50,
      trustScore: 50,
      adoptionLevel: null,
      baselineTime: 0,
      finalTime: 0
    });
    setTrialStep(1);
    startBaselineTimer();
  };
  
  // 记录基线决策
  const recordBaselineDecision = (decision, confidence) => {
    const baselineTime = Date.now() - baselineStartTime;
    setCurrentTrialData(prev => ({
      ...prev,
      baselineDecision: decision,
      confidenceBefore: confidence,
      baselineTime
    }));
    setTrialStep(2);
    startFinalTimer();
  };
  
  // 记录最终决策
  const recordFinalDecision = (decision, confidence, trust, adoption) => {
    const finalTime = Date.now() - finalStartTime;
    const finalTrialData = {
      ...currentTrialData,
      finalDecision: decision,
      confidenceAfter: confidence,
      trustScore: trust,
      adoptionLevel: adoption,
      finalTime
    };
    
    // 更新试验数据
    const updatedTrials = [...trials];
    updatedTrials[currentTrialIndex] = {
      ...updatedTrials[currentTrialIndex],
      data: finalTrialData
    };
    setTrials(updatedTrials);
    
    // 保存到后端
    saveDataToBackend({
      participant_id: participantId,
      vignette_id: currentTrialData.vignette.id,
      condition: trials[currentTrialIndex].condition,
      baseline_decision: currentTrialData.baselineDecision,
      final_decision: decision,
      adoption_level: adoption,
      trust_score: trust,
      baseline_reaction_time: currentTrialData.baselineTime,
      final_reaction_time: finalTime
    });
    
    // 进入下一个试验
    const nextIndex = currentTrialIndex + 1;
    setCurrentTrialIndex(nextIndex);
    if (nextIndex < trials.length) {
      // 延迟一点确保状态更新
      setTimeout(() => {
        const trial = trials[nextIndex];
        setCurrentTrialData({
          ...trial,
          baselineDecision: null,
          confidenceBefore: 50,
          finalDecision: null,
          confidenceAfter: 50,
          trustScore: 50,
          adoptionLevel: null,
          baselineTime: 0,
          finalTime: 0
        });
        setTrialStep(1);
        setBaselineStartTime(Date.now());
      }, 50);
    } else {
      goToPage('questionnaire');
    }
  };
  
  // 提交问卷
  const submitQuestionnaire = (data) => {
    setQuestionnaireData(data);
    // 自动保存数据
    setTimeout(() => exportData(), 100);
    goToPage('end');
  };
  
  // 导出数据
  const exportData = () => {
    const totalDuration = Date.now() - experimentStartTime;
    
    const exportObj = {
      participantId,
      demographics,
      trials: trials.map(t => ({
        trialId: t.trialId,
        vignetteId: t.vignette.id,
        condition: t.condition,
        correctness: t.condition.includes('A') || t.condition.includes('B') ? 'correct' : 'unsafe',
        ...t.data
      })),
      questionnaire: questionnaireData,
      totalDuration,
      exportTime: new Date().toISOString()
    };
    
    // 创建下载
    const dataStr = JSON.stringify(exportObj, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `experiment_data_${participantId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // 导出CSV格式
  const exportCSV = () => {
    const totalDuration = Date.now() - experimentStartTime;
    
    // 创建CSV头
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "participant_id,trial_id,vignette_id,condition,correctness,baseline_decision,final_decision,adoption_level,confidence_before,confidence_after,trust_score,response_time_baseline,response_time_final\n";
    
    // 添加每个试验的数据
    trials.forEach(t => {
      if (t.data) {
        const row = [
          participantId,
          t.trialId,
          t.vignette.id,
          t.condition,
          t.condition.includes('A') || t.condition.includes('B') ? 'correct' : 'unsafe',
          t.data.baselineDecision,
          t.data.finalDecision,
          t.data.adoptionLevel,
          t.data.confidenceBefore,
          t.data.confidenceAfter,
          t.data.trustScore,
          t.data.baselineTime,
          t.data.finalTime
        ].map(field => `"${field}"`).join(",");
        csvContent += row + "\n";
      }
    });
    
    // 创建下载
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `experiment_data_${participantId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 渲染当前页面
  const renderPage = () => {
    switch (currentPage) {
      case 'welcome':
        return <WelcomePage onNext={() => goToPage('consent')} />;
      
      case 'consent':
        return <ConsentPage onNext={() => goToPage('demographics')} />;
      
      case 'demographics':
        return <DemographicsPage onSubmit={handleDemographicsSubmit} />;
      
      case 'instructions':
        return <InstructionsPage onNext={startPractice} />;
      
      case 'practice':
        if (practiceStep === 1) {
          return (
            <TrialVignettePage
              vignette={practiceVignette}
              trialNumber={0}
              totalTrials={0}
              onNext={recordPracticeBaseline}
              onStartTimer={() => setPracticeBaselineStart(Date.now())}
              isPractice={true}
            />
          );
        } else {
          return (
            <TrialFinalDecisionPage
              vignette={practiceVignette}
              condition="B"
              trialNumber={0}
              totalTrials={0}
              baselineDecision={practiceData?.baselineDecision}
              onNext={recordPracticeFinal}
              isPractice={true}
            />
          );
        }
      
      case 'mainExperiment':
        if (currentTrialIndex >= trials.length) {
          goToPage('questionnaire');
          return null;
        }
        
        const currentTrial = trials[currentTrialIndex];
        
        switch (trialStep) {
          case 1:
            return (
              <TrialVignettePage
                vignette={currentTrial.vignette}
                trialNumber={currentTrialIndex + 1}
                totalTrials={trials.length}
                onNext={recordBaselineDecision}
                onStartTimer={startBaselineTimer}
              />
            );
          
          case 2:
            return (
              <TrialFinalDecisionPage
                vignette={currentTrial.vignette}
                condition={currentTrial.condition}
                trialNumber={currentTrialIndex + 1}
                totalTrials={trials.length}
                baselineDecision={currentTrialData?.baselineDecision}
                onNext={recordFinalDecision}
              />
            );
          
          default:
            return null;
        }
      
      case 'questionnaire':
        return <QuestionnairePage onSubmit={submitQuestionnaire} />;
      
      case 'end':
        return <EndPage onExportJSON={exportData} onExportCSV={exportCSV} />;
      
      default:
        return <WelcomePage onNext={() => goToPage('consent')} />;
    }
  };
  
  return (
    <div className="container">
      <div className="card">
        {renderPage()}
      </div>
    </div>
  );
}

// 欢迎页面组件
function WelcomePage({ onNext }) {
  return (
    <div className="text-center">
      <h1>临床决策研究实验</h1>
      <p>欢迎参加本次临床决策研究实验。</p>
      <p>本实验旨在研究人工智能建议对临床决策的影响。</p>
      <p>实验大约需要20-30分钟完成。</p>
      <div className="mt-30">
        <button className="btn btn-primary" onClick={onNext}>
          开始实验
        </button>
      </div>
    </div>
  );
}

// 知情同意书页面组件
function ConsentPage({ onNext }) {
  const [agreed, setAgreed] = useState(false);
  
  return (
    <div>
      <h2>知情同意书</h2>
      <div className="consent-box">
        <p><strong>研究目的：</strong></p>
        <p>本研究旨在探讨人工智能建议对临床医生决策的影响。</p>
        
        <p><strong>研究过程：</strong></p>
        <p>您将被要求阅读临床病例，并根据病例信息做出诊断和治疗决策。随后，您将看到人工智能的建议，并做出最终决策。</p>
        
        <p><strong>风险与收益：</strong></p>
        <p>本研究无已知风险。您的参与将有助于改进人工智能辅助医疗决策系统。</p>
        
        <p><strong>保密性：</strong></p>
        <p>您的所有数据将被匿名处理，仅用于研究目的。</p>
        
        <p><strong>自愿参与：</strong></p>
        <p>您的参与完全自愿，您可以随时退出研究。</p>
        
        <p><strong>联系方式：</strong></p>
        <p>如有任何问题，请联系研究团队。</p>
      </div>
      
      <div className="checkbox-group">
        <input
          type="checkbox"
          id="consentCheckbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <label htmlFor="consentCheckbox">
          我已阅读并理解上述信息，同意参加本研究
        </label>
      </div>
      
      <div className="mt-30">
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!agreed}
        >
          下一步
        </button>
      </div>
    </div>
  );
}

// 人口统计信息页面组件
function DemographicsPage({ onSubmit }) {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    role: '',
    grade: '',
    specialty: '',
    experience: '',
    aiExperience: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <div>
      <h2>人口统计信息</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="age">年龄：</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="gender">性别：</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">请选择</option>
            <option value="male">男</option>
            <option value="female">女</option>
            <option value="other">其他</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="role">身份：</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="">请选择</option>
            <option value="doctor">临床医生</option>
            <option value="student">医学生</option>
          </select>
        </div>
        
        {formData.role === 'student' && (
          <div className="form-group">
            <label htmlFor="grade">年级：</label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
            >
              <option value="">请选择</option>
              <option value="1">大一</option>
              <option value="2">大二</option>
              <option value="3">大三</option>
              <option value="4">大四</option>
              <option value="5">大五</option>
              <option value="graduate">研究生阶段</option>
            </select>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="specialty">专业/科室：</label>
          <select
            id="specialty"
            name="specialty"
            value={formData.specialty}
            onChange={handleChange}
            required
          >
            <option value="">请选择</option>
            <option value="internal">内科</option>
            <option value="surgery">外科</option>
            <option value="pediatrics">儿科</option>
            <option value="obstetrics">妇产科</option>
            <option value="emergency">急诊科</option>
            <option value="other">其他</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="experience">临床工作年限：</label>
          <select
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            required
          >
            <option value="">请选择</option>
            <option value="0">无经验（学生）</option>
            <option value="0-5">0-5年</option>
            <option value="6-10">6-10年</option>
            <option value="11-20">11-20年</option>
            <option value="20+">20年以上</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="aiExperience">人工智能使用经验：</label>
          <select
            id="aiExperience"
            name="aiExperience"
            value={formData.aiExperience}
            onChange={handleChange}
            required
          >
            <option value="">请选择</option>
            <option value="none">无经验</option>
            <option value="limited">有限经验</option>
            <option value="moderate">中等经验</option>
            <option value="extensive">丰富经验</option>
          </select>
        </div>
        
        <div className="mt-30">
          <button type="submit" className="btn btn-primary">
            下一步
          </button>
        </div>
      </form>
    </div>
  );
}

// 实验说明页面组件
function InstructionsPage({ onNext }) {
  return (
    <div>
      <h2>实验说明</h2>
      <p>在本实验中，您将完成多个临床病例的决策任务。</p>
      
      <h3>实验流程：</h3>
      <ol>
        <li>阅读临床病例描述</li>
        <li>做出您的初步诊断和治疗决策</li>
        <li>查看人工智能的建议</li>
        <li>做出最终决策</li>
      </ol>
      
      <h3>注意事项：</h3>
      <ul>
        <li>请根据您的临床经验做出决策</li>
        <li>人工智能建议仅供参考</li>
        <li>请认真阅读每个病例</li>
        <li>实验过程中请勿查阅外部资料</li>
      </ul>
      
      <div className="mt-30">
        <button className="btn btn-primary" onClick={onNext}>
          开始练习
        </button>
      </div>
    </div>
  );
}

// 试验：显示临床病例页面组件
function TrialVignettePage({ vignette, trialNumber, totalTrials, onNext, onStartTimer, isPractice = false }) {
  const [selectedOption, setSelectedOption] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [error, setError] = useState('');
  
  useEffect(() => {
    onStartTimer();
  }, []);
  
  const handleSubmit = () => {
    if (!selectedOption) {
      setError('请选择一个选项');
      return;
    }
    setError('');
    onNext(selectedOption, confidence);
  };
  
  return (
    <div>
      {isPractice ? (
        <div className="practice-notice">
          <strong>练习试验</strong> - 此试验用于熟悉界面，数据不会被记录
        </div>
      ) : (
        <>
          <div className="progress-text">
            试验 {trialNumber} / {totalTrials}
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(trialNumber / totalTrials) * 100}%` }}
            ></div>
          </div>
        </>
      )}
      
      <div className="vignette-box">
        <h3>{vignette.title}</h3>
        <p>{vignette.description}</p>
        <p><strong>问题：</strong>{vignette.question}</p>
      </div>
      
      <div className="option-group">
        {vignette.options.map((option, index) => (
          <div
            key={index}
            className={`option-item ${selectedOption === option.charAt(0) ? 'selected' : ''}`}
            onClick={() => setSelectedOption(option.charAt(0))}
          >
            <input
              type="radio"
              name="decision"
              checked={selectedOption === option.charAt(0)}
              onChange={() => setSelectedOption(option.charAt(0))}
            />
            {option}
          </div>
        ))}
      </div>
      
      <div className="slider-container">
        <label>您的置信度（0-100）：</label>
        <div className="slider-value">{confidence}</div>
        <input
          type="range"
          min="0"
          max="100"
          value={confidence}
          onChange={(e) => setConfidence(parseInt(e.target.value))}
        />
        <div className="slider-labels">
          <span>完全不自信</span>
          <span>完全自信</span>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="mt-30">
        <button className="btn btn-primary" onClick={handleSubmit}>
          下一步
        </button>
      </div>
    </div>
  );
}

// 试验：最终决策页面组件
function TrialFinalDecisionPage({ vignette, condition, trialNumber, totalTrials, baselineDecision, onNext, isPractice = false }) {
  const [selectedOption, setSelectedOption] = useState(baselineDecision || '');
  const [confidence, setConfidence] = useState(50);
  const [trust, setTrust] = useState(50);
  const [adoption, setAdoption] = useState('');
  const [error, setError] = useState('');
  
  // 根据条件确定显示的文本
  const getRecommendationText = () => {
    if (condition === 'A' || condition === 'B') {
      return condition.includes('B') ? vignette.cotText : vignette.noCotText;
    } else {
      const unsafeOption = vignette.options.find(opt => opt.charAt(0) === vignette.unsafeAnswer);
      if (condition === 'C') {
        return `AI建议：${unsafeOption.substring(3)}\n\n基于病例信息，建议选择${vignette.unsafeAnswer}选项。这是常见的处理方案。`;
      } else {
        return `AI建议：${unsafeOption.substring(3)}\n\n推理步骤：\n1. 症状分析：根据患者症状进行分析\n2. 常规考虑：考虑常见的处理方案\n3. 风险评估：评估治疗风险和收益\n4. 指南参考：参考相关临床指南\n5. 治疗方案：建议选择${vignette.unsafeAnswer}选项`;
      }
    }
  };
  
  const handleSubmit = () => {
    if (!selectedOption) {
      setError('请选择一个选项');
      return;
    }
    if (!adoption) {
      setError('请选择采纳程度');
      return;
    }
    setError('');
    onNext(selectedOption, confidence, trust, adoption);
  };
  
  return (
    <div>
      {isPractice ? (
        <div className="practice-notice">
          <strong>练习试验</strong> - 此试验用于熟悉界面，数据不会被记录
        </div>
      ) : (
        <>
          <div className="progress-text">试验 {trialNumber} / {totalTrials}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(trialNumber / totalTrials) * 100}%` }}></div>
          </div>
        </>
      )}
      
      <div className="vignette-box">
        <h3>{vignette.title}</h3>
        <p>{vignette.description}</p>
        <p><strong>问题：</strong>{vignette.question}</p>
      </div>
      
      <div className="ai-recommendation">
        <h3>人工智能建议</h3>
        <div style={{ whiteSpace: 'pre-line' }}>{getRecommendationText()}</div>
      </div>
      
      <div className="vignette-box" style={{ borderLeftColor: '#27ae60' }}>
        <p><strong>您的初始决策：</strong>{baselineDecision}</p>
        <p><strong>请做出您的最终决策：</strong></p>
      </div>
      
      <div className="option-group">
        {vignette.options.map((option, index) => (
          <div
            key={index}
            className={`option-item ${selectedOption === option.charAt(0) ? 'selected' : ''}`}
            onClick={() => setSelectedOption(option.charAt(0))}
          >
            <input
              type="radio"
              name="finalDecision"
              checked={selectedOption === option.charAt(0)}
              onChange={() => setSelectedOption(option.charAt(0))}
            />
            {option}
          </div>
        ))}
      </div>
      
      <div className="slider-container">
        <label>您的置信度（0-100）：</label>
        <div className="slider-value">{confidence}</div>
        <input
          type="range"
          min="0"
          max="100"
          value={confidence}
          onChange={(e) => setConfidence(parseInt(e.target.value))}
        />
        <div className="slider-labels">
          <span>完全不自信</span>
          <span>完全自信</span>
        </div>
      </div>
      
      <div className="slider-container">
        <label>对AI建议的信任度（0-100）：</label>
        <div className="slider-value">{trust}</div>
        <input
          type="range"
          min="0"
          max="100"
          value={trust}
          onChange={(e) => setTrust(parseInt(e.target.value))}
        />
        <div className="slider-labels">
          <span>完全不信任</span>
          <span>完全信任</span>
        </div>
      </div>
      
      <div className="form-group">
        <label>对AI建议的采纳程度：</label>
        <div className="adoption-options">
          <div
            className={`adoption-option ${adoption === 'fully' ? 'selected' : ''}`}
            onClick={() => setAdoption('fully')}
          >
            <div className="title">完全采纳</div>
            <div className="desc">完全按照AI建议决策</div>
          </div>
          <div
            className={`adoption-option ${adoption === 'partially' ? 'selected' : ''}`}
            onClick={() => setAdoption('partially')}
          >
            <div className="title">部分采纳</div>
            <div className="desc">参考AI建议但有所调整</div>
          </div>
          <div
            className={`adoption-option ${adoption === 'not' ? 'selected' : ''}`}
            onClick={() => setAdoption('not')}
          >
            <div className="title">不采纳</div>
            <div className="desc">坚持自己的决策</div>
          </div>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="mt-30">
        <button className="btn btn-primary" onClick={handleSubmit}>
          下一步
        </button>
      </div>
    </div>
  );
}

// 任务后问卷页面组件
function QuestionnairePage({ onSubmit }) {
  const [formData, setFormData] = useState({
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <div>
      <h2>任务后问卷</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>1. 您认为人工智能建议在临床决策中的作用如何？</label>
          <select
            name="q1"
            value={formData.q1}
            onChange={handleChange}
            required
          >
            <option value="">请选择</option>
            <option value="very_helpful">非常有帮助</option>
            <option value="helpful">有帮助</option>
            <option value="neutral">一般</option>
            <option value="not_helpful">没有帮助</option>
            <option value="very_not_helpful">完全没有帮助</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>2. 您对人工智能建议的信任程度如何？</label>
          <select
            name="q2"
            value={formData.q2}
            onChange={handleChange}
            required
          >
            <option value="">请选择</option>
            <option value="very_trust">非常信任</option>
            <option value="trust">信任</option>
            <option value="neutral">一般</option>
            <option value="distrust">不信任</option>
            <option value="very_distrust">完全不信任</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>3. 您认为人工智能建议会影响您的临床决策吗？</label>
          <select
            name="q3"
            value={formData.q3}
            onChange={handleChange}
            required
          >
            <option value="">请选择</option>
            <option value="strongly_influence">强烈影响</option>
            <option value="influence">影响</option>
            <option value="neutral">一般</option>
            <option value="not_influence">不影响</option>
            <option value="strongly_not_influence">完全不影响</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>4. 您认为人工智能建议的质量如何？</label>
          <select
            name="q4"
            value={formData.q4}
            onChange={handleChange}
            required
          >
            <option value="">请选择</option>
            <option value="very_high">非常高</option>
            <option value="high">高</option>
            <option value="neutral">一般</option>
            <option value="low">低</option>
            <option value="very_low">非常低</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>5. 您对未来使用人工智能辅助临床决策的态度如何？</label>
          <select
            name="q5"
            value={formData.q5}
            onChange={handleChange}
            required
          >
            <option value="">请选择</option>
            <option value="very_positive">非常积极</option>
            <option value="positive">积极</option>
            <option value="neutral">一般</option>
            <option value="negative">消极</option>
            <option value="very_negative">非常消极</option>
          </select>
        </div>
        
        <div className="mt-30">
          <button type="submit" className="btn btn-primary">
            提交问卷
          </button>
        </div>
      </form>
    </div>
  );
}

// 结束页面组件
function EndPage({ onExportJSON, onExportCSV }) {
  return (
    <div className="text-center">
      <h2>实验结束</h2>
      <p>感谢您的参与！</p>
      <p>您的数据已自动保存到本地。</p>
      
      <div className="mt-30">
        <p>如有任何问题，请联系研究团队。</p>
      </div>
    </div>
  );
}

// 渲染应用
ReactDOM.render(<App />, document.getElementById('root'));
